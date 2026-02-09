import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';
import { useForm } from 'react-hook-form';
import { CATEGORIES } from '../../utils/categories';

const CreateShop = ({
  sellerId,
  setActiveStep,
}: {
  sellerId: string;
  setActiveStep: (step: number) => void;
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const shopCreateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/create-shop`,
        data,
        {
          withCredentials: true,
        },
      );

      return response.data;
    },
    onSuccess: () => {
      setActiveStep(3);
    },
  });

  const onSubmit = async (data: any) => {
    const shopData = { ...data, sellerId };
    shopCreateMutation.mutate(shopData);
  };

  // Word count for bio
  const countWords = (text: string) => text.trim().split(/\s+/).length;
  const bioValue = watch('bio', '');
  const bioWordCount = countWords(bioValue);

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h3 className="text-2xl font-semibold text-center mb-4">
          Setup new shop
        </h3>

        {/* Shop Name */}
        <label className="block text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Shop name"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register('name', {
            required: 'Shop name is required',
          })}
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{String(errors.name.message)}</p>
        )}

        {/* Bio */}
        <label className="block text-gray-700 mb-1">
          Bio (Max 100 words) <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={4}
          placeholder="Tell customers about your shop..."
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1 resize-none"
          {...register('bio', {
            required: 'Shop Bio is required',
            validate: (value) =>
              countWords(value) <= 100 || 'Bio cannot exceed 100 words',
          })}
        />
        {/* Word Counter */}
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>{bioWordCount} / 100 words</span>
          {bioWordCount > 100 && (
            <span className="text-red-500">Too many words</span>
          )}
        </div>
        {errors.bio && (
          <p className="text-red-500 text-sm">{String(errors.bio.message)}</p>
        )}

        {/* Address */}
        <label className="block text-gray-700 mb-1">
          Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Shop address"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register('address', {
            required: 'Address is required',
            maxLength: {
              value: 250,
              message: 'Address cannot exceed 250 characters',
            },
          })}
        />
        {errors.address && (
          <p className="text-red-500 text-sm">
            {String(errors.address.message)}
          </p>
        )}

        {/* Opening Hours */}
        <label className="block text-gray-700 mb-1">
          Opening Hours <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="9:00 AM - 5:00 PM"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register('opening_hours', {
            required: 'Opening hours are required',
            pattern: {
              value:
                /^[0-9]{1,2}(:[0-9]{2})? (AM|PM) - [0-9]{1,2}(:[0-9]{2})? (AM|PM)$/,
              message: 'Opening hours should be in format: 9:00 AM - 5:00 PM',
            },
          })}
        />
        {errors.opening_hours && (
          <p className="text-red-500 text-sm">
            {String(errors.opening_hours.message)}
          </p>
        )}

        {/* Website */}
        <label className="block text-gray-700 mb-1">
          Website <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="url"
          placeholder="https://yourshop.com"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register('website', {
            pattern: {
              value:
                /^(https?:\/\/)?(www\.)?[a-z0-9]+\.[a-z]{2,}(\.[a-z]{2,})?(\/\S*)?$/,
              message: 'Please enter a valid URL',
            },
          })}
        />
        {errors.website && (
          <p className="text-red-500 text-sm">
            {String(errors.website.message)}
          </p>
        )}

        {/* Category */}
        <label className="block text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>

        {/* Mobile select (inline list) */}
        <select
          size={5}
          className="block sm:hidden w-full p-2 border border-gray-300 rounded-[4px] mb-1 max-h-40 overflow-y-auto"
          {...register('category', { required: 'Please select a category' })}
        >
          <option value="">Select Category</option>
          {CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        {/* Desktop select (normal dropdown) */}
        <select
          className="hidden sm:block w-full p-2 border border-gray-300 rounded-[4px] mb-1"
          {...register('category', { required: 'Please select a category' })}
        >
          <option value="">Select Category</option>
          {CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        {errors.category && (
          <p className="text-red-500 text-sm">
            {String(errors.category.message)}
          </p>
        )}

        <button
          type="submit"
          className="w-full py-2 mt-4 bg-black text-white rounded-lg"
        >
          Create Shop
        </button>
      </form>
    </div>
  );
};

export default CreateShop;
