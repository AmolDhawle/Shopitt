'use client';
import ImagePlaceholder from 'apps/seller-ui/src/shared/components/image-placeholder';
import { ChevronRight, Wand, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  CustomProperties,
  Input,
  RichTextEditor,
  SizeSelector,
} from '@shopitt/components';
import { ColorSelector, CustomSpecifications } from '@shopitt/components';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import Link from 'next/link';
import Image from 'next/image';
import { enhancements } from 'apps/seller-ui/src/utils/AI.enhancements';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface UploadedImage {
  fileId: string;
  file_url: string;
}

interface ProductFormValues {
  title: string;
  short_description: string;
  tags: string;
  warranty: string;
  slug: string;
  brand: string;
  category: string;
  subcategory: string;
  regular_price: number;
  sale_price: number;
  stock: number;
  sizes: string[];
  colors: string[];
  discountCodes: string[];
  images: (UploadedImage | null)[];
  video_url: string;
  custom_specifications: { name: string; value: string }[];
  custom_properties: { label: string; values: string[] }[];
  cash_on_delivery: string;
  detailed_description: string;
}

const Page = () => {
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      colors: [],
      images: [null],
      custom_specifications: [],
      custom_properties: [],
    },
  });

  const [openImageModal, setOpenImageModal] = useState(false);
  const [isChanged, setIsChanged] = useState(true);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [imageUploadingLoader, setImageUploadingLoader] = useState(false);
  const [images, setImages] = useState<(UploadedImage | null)[]>([null]);
  const [loading, setLoading] = useState(false);
  const [activeEffect, setActiveEffect] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get('/product/api/get-categories');
        return res.data;
      } catch (error) {
        console.log(error);
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const { data: discountCodes = [], isLoading: discountLoading } = useQuery({
    queryKey: ['shop-discounts'],
    queryFn: async () => {
      const res = await axiosInstance.get('/product/api/get-discount-codes');
      console.log('REsponse', res);
      return res.data?.discounts || [];
    },
  });

  const categories = data?.categories || [];
  const subCategoriesData = data?.subCategories || {};

  const selectedCategory = watch('category');
  const regularPrice = watch('regular_price');

  console.log('Categories', categories);
  console.log('Subcategories', subCategoriesData);

  const subcategories = useMemo(() => {
    return selectedCategory ? subCategoriesData[selectedCategory] || [] : [];
  }, [selectedCategory, subCategoriesData]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      await axiosInstance.post('/product/api/create-product', data);
      router.push('/dashboard/all-products');
    } catch (error: any) {
      toast.error(error?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const convertFileToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = async (file: File | null, index: number) => {
    if (!file || index === null) return;

    setImageUploadingLoader(true);
    try {
      const fileName = await convertFileToBase64(file);

      const response = await axiosInstance.post(
        '/product/api/upload-product-image',
        { fileName },
      );

      const uploadedImage: UploadedImage = {
        fileId: response.data.fileId,
        file_url: response.data.file_url,
      };
      const updatedImages = [...images];

      updatedImages[index] = uploadedImage;

      // Add new empty slot if last image and less than 8
      if (index === images.length - 1 && images.length < 8) {
        updatedImages.push(null);
      }

      setImages(updatedImages);
      setValue('images', updatedImages);
    } finally {
      setImageUploadingLoader(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    try {
      const updatedImages = [...images];

      const imageToDelete = updatedImages[index];
      if (imageToDelete && typeof imageToDelete === 'object') {
        console.log('File tp delete', imageToDelete.fileId);
        await axiosInstance.delete('/product/api/delete-product-image', {
          data: {
            fileId: imageToDelete.fileId!,
          },
        });
        console.log('Image deleted successfully');
      }
      updatedImages.splice(index, 1);

      // Add null placeholder
      if (!updatedImages.includes(null) && updatedImages.length < 8) {
        updatedImages.push(null);
      }

      setImages(updatedImages);
      setValue('images', updatedImages);
    } catch (error) {
      console.log(error);
    }
  };

  const applyTransformation = async (transformation: string) => {
    if (!baseImage || processing) return;
    setProcessing(true);
    setActiveEffect(transformation);

    try {
      const transformedUrl = `${baseImage}?tr=${transformation}`;

      setSelectedImage(transformedUrl);
    } catch (error) {
      console.log(error);
    } finally {
      setProcessing(false);
    }
  };

  console.log('SelectedImage', selectedImage);

  const handleSaveDraft = () => {};

  return (
    <form
      className="w-full mx-auto p-8 shadow-md rounded-lg text-white"
      onSubmit={handleSubmit(onSubmit)}
    >
      <h2 className="text-2xl py-2 font-semibold font-poppins text-white">
        Create Product
      </h2>
      <div className="flex items-center">
        <Link href={'/dashboard'} className="text-[#80Deea] cursor-pointer">
          Dashboard
        </Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>Create Product</span>
      </div>

      {/* Content Layout */}
      <div className="py-4 w-full md:flex md:justify-between gap-6">
        {/* Image upload section */}
        <div className="md:w-[35%]">
          {images?.length > 0 && (
            <ImagePlaceholder
              setOpenImageModal={setOpenImageModal}
              setBaseImage={setBaseImage}
              size="765 x 850"
              small={false}
              index={0}
              imageUploadingLoader={imageUploadingLoader}
              setActiveEffect={setActiveEffect}
              images={images}
              onImageChange={handleImageChange}
              setSelectedImage={setSelectedImage}
              onRemove={handleRemoveImage}
            />
          )}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {images.slice(1).map((_, index) => (
              <ImagePlaceholder
                setOpenImageModal={setOpenImageModal}
                setBaseImage={setBaseImage}
                size="765 x 850"
                key={index}
                small
                index={index + 1}
                imageUploadingLoader={imageUploadingLoader}
                setActiveEffect={setActiveEffect}
                images={images}
                onImageChange={handleImageChange}
                setSelectedImage={setSelectedImage}
                onRemove={handleRemoveImage}
              />
            ))}
          </div>
        </div>

        {/* Form Input Section */}
        <div className="md:w-[65%]">
          <div className="flex w-full gap-6">
            {/* Product title input */}
            <div className="w-2/4">
              <Input
                label="Product Title*"
                className="pl-2"
                placeholder="Enter product title"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.title.message as string}
                </p>
              )}
              <div className="mt-2">
                <Input
                  type="textarea"
                  rows={7}
                  cols={10}
                  label="Short Description * (Max 150 words)"
                  placeholder="Enter short description"
                  {...register('short_description', {
                    required: 'Description is required',
                    maxLength: {
                      value: 150,
                      message: 'Description cannot exceed 150 words',
                    },
                  })}
                />
                {errors.short_description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.short_description.message as string}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <Input
                  label="Tags*"
                  placeholder="apple, flagship"
                  {...register('tags', { required: 'Tags are required' })}
                />
                {errors.tags && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.tags.message as string}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <Input
                  label="Warranty"
                  placeholder="Enter warranty details"
                  {...register('warranty', {
                    required: 'Warranty details are required',
                  })}
                />
                {errors.warranty && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.warranty.message as string}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <Input
                  label="Slug*"
                  placeholder="product_slug"
                  {...register('slug', {
                    required: 'Slug is required',
                    pattern: {
                      value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                      message:
                        'Slug must be lowercase, alphanumeric, and can include hyphens',
                    },
                    minLength: {
                      value: 3,
                      message: 'Slug must be at least 3 characters long',
                    },
                    maxLength: {
                      value: 50,
                      message: 'Slug cannot exceed 50 characters',
                    },
                  })}
                />
                {errors.slug && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.slug.message as string}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <Input
                  label="Brand"
                  placeholder="Enter brand name"
                  {...register('brand', {
                    required: 'Brand is required',
                  })}
                />
                {errors.brand && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.brand.message as string}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <ColorSelector control={control} name="colors" />
              </div>
              <div className="mt-2">
                <CustomSpecifications
                  control={control}
                  name="custom_specifications"
                />
              </div>
              <div className="mt-2">
                <CustomProperties
                  control={control}
                  name="custom_properties"
                  errors={errors}
                />
              </div>
              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Cash On Delivery*
                </label>
                <select
                  {...register('cash_on_delivery', {
                    required: 'This is a required field.',
                  })}
                  defaultValue="Yes"
                  className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded-lg"
                >
                  <option value="yes" className="bg-black">
                    Yes
                  </option>
                  <option value="no" className="bg-black">
                    No
                  </option>
                </select>
              </div>
            </div>

            <div className="w-2/4">
              <label className="block font-semibold text-gray-300 mb-1">
                Category*
              </label>
              {isLoading ? (
                <p className="text-gray-400">Loading categories...</p>
              ) : isError ? (
                <p className="text-red-500">Failed to load categories</p>
              ) : (
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded-lg"
                    >
                      {' '}
                      <option value="" className="bg-black">
                        Select Category
                      </option>
                      {categories?.map((category: string) => (
                        <option
                          value={category}
                          key={category}
                          className="bg-black"
                        >
                          {category}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.category.message as string}
                </p>
              )}

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Subcategory*
                </label>
                {isLoading ? (
                  <p className="text-gray-400">Loading categories...</p>
                ) : isError ? (
                  <p className="text-red-500">Failed to load categories</p>
                ) : (
                  <Controller
                    name="subcategory"
                    control={control}
                    rules={{ required: 'Subcategory is required' }}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded-lg"
                      >
                        {' '}
                        <option value="" className="bg-black">
                          Select Category
                        </option>
                        {subcategories?.map((subcategory: string) => (
                          <option
                            value={subcategory}
                            key={subcategory}
                            className="bg-black"
                          >
                            {subcategory}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                )}
                {errors.subcategory && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.subcategory.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Detailed Description* (Min 100 words)
                </label>
                <Controller
                  name="detailed_description"
                  control={control}
                  rules={{
                    required: 'Detailed description is required.',
                    validate: (value) => {
                      const wordCount = value
                        ?.split(/\s+/)
                        .filter((word: string) => word).length;
                      return (
                        wordCount >= 100 ||
                        'Description must be atleast 100 words.'
                      );
                    },
                  }}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.detailed_description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.detailed_description.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Video Url"
                  placeholder="https://www.youtube.com/embed/xyz123"
                  {...register('video_url', {
                    pattern: {
                      value:
                        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|shorts\/)?([a-zA-Z0-9_-]{11})(\S+)?$/,
                      message:
                        'Invalid Youtube embed URL! Use format: https://www.youtube.com/embed/xyz123',
                    },
                  })}
                />
                {errors.video_url && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.video_url.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Regular Price"
                  placeholder="2000₹"
                  {...register('regular_price', {
                    valueAsNumber: true,
                    min: { value: 1, message: 'Price must be atleast 1' },
                    validate: (value) =>
                      !isNaN(value) || 'Only numbers are allowed',
                  })}
                />
                {errors.regular_price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.regular_price.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Sale Price"
                  placeholder="1500₹"
                  {...register('sale_price', {
                    valueAsNumber: true,
                    min: { value: 1, message: 'Sale Price must be atleast 1' },
                    validate: (value) => {
                      if (isNaN(value)) return 'Only numbers are allowed';
                      if (regularPrice && value >= regularPrice) {
                        return 'Sale Price must be less than Regular Price';
                      }
                      return true;
                    },
                  })}
                />
                {errors.sale_price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.sale_price.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Stock*"
                  placeholder="100"
                  {...register('stock', {
                    required: 'Stock is required!',
                    valueAsNumber: true,
                    min: { value: 1, message: 'Stock must be atleast 1' },
                    max: {
                      value: 1000,
                      message: 'Stock cannot exceed 1000 units.',
                    },
                    validate: (value) => {
                      if (isNaN(value)) return 'Only numbers are allowed';
                      if (!Number.isInteger(value)) {
                        return 'Stock must be a whole number.';
                      }
                      return true;
                    },
                  })}
                />
                {errors.stock && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.stock.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <SizeSelector control={control} errors={errors} name="sizes" />
              </div>

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Select Discount Codes (optional)
                </label>
                {discountLoading ? (
                  <p className="text-gray-400">Loading discount codes ...</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {discountCodes?.map((code: any) => (
                      <button
                        key={code.id}
                        type="button"
                        className={`px-3 py-1 rounded-md text-sm font-semibold border 
                          ${
                            watch('discountCodes')?.includes(code.id)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                          }`}
                        onClick={() => {
                          const currentSelection = watch('discountCodes') || [];
                          const updatedSelection = currentSelection?.includes(
                            code.id,
                          )
                            ? currentSelection.filter(
                                (id: string) => id !== code.id,
                              )
                            : [...currentSelection, code.id];
                          setValue('discountCodes', updatedSelection);
                        }}
                      >
                        {code?.publicName} {code?.discountValue}
                        {code?.discountType === 'PERCENTAGE' ? '%' : '₹'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {openImageModal && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-[450px] text-white">
            <div className="flex justify-between items-center pb-3 mb-4">
              <h2 className="text-lg font-semibold">Enhance product image</h2>
              <X
                size={20}
                className="cursor-pointer"
                onClick={() => setOpenImageModal(!openImageModal)}
              />
            </div>
            <div className="relative w-full h-[250px] rounded-md overflow-hidde n border border-gray-600">
              <Image src={selectedImage} alt="product-image" fill />
            </div>
            {selectedImage && (
              <div className="mt-4 space-y-2">
                <h3 className="text-white text-sm font-semibold">
                  AI Enhancements
                </h3>
                <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto">
                  {enhancements?.map(({ label, effect }) => (
                    <button
                      key={effect}
                      className={`p-2 rounded-md flex items-center gap-2 
                        ${activeEffect === effect ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                      onClick={() => {
                        applyTransformation(effect);
                      }}
                      disabled={processing}
                    >
                      <Wand size={18} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-3">
        {isChanged && (
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md"
          >
            Save Draft
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default Page;
