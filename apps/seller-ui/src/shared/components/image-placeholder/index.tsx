import { ImageUp, WandSparkles, X } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

const ImagePlaceholder = ({
  size,
  small,
  onImageChange,
  onRemove,
  defaultImage = null,
  setSelectedImage,
  setBaseImage,
  setActiveEffect,
  imageUploadingLoader,
  index,
  images,
  setOpenImageModal,
}: {
  size: string;
  small?: boolean;
  onImageChange: (file: File | null, index: number) => void;
  onRemove: (index: number) => void;
  defaultImage?: string | null;
  setSelectedImage: (e: string) => void;
  setBaseImage: (url: string) => void;
  setActiveEffect: (e: string | null) => void;
  imageUploadingLoader: boolean;
  index: number;
  images: any;
  setOpenImageModal: (openImageModal: boolean) => void;
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(defaultImage);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      onImageChange(file, index);
    }
  };

  useEffect(() => {
    const imageUrl = images[index]?.file_url || null;
    setImagePreview(imageUrl);
  }, [images, index]);

  return (
    <div
      className={`relative ${small ? 'h-[180px]' : 'h-[450px]'} w-full cursor-pointer bg-[#1e1e1e] border border-gray-600 rounded-lg flex flex-col items-center justify-center overflow-hidden`}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id={`image-upload-${index}`}
        onChange={handleFileChange}
      />
      {imagePreview ? (
        <>
          <button
            type="button"
            disabled={imageUploadingLoader}
            onClick={() => onRemove?.(index)}
            className="absolute top-3 right-3 bg-red-500 text-white shadow-lg rounded-full p-2 z-10"
          >
            <X size={16} />
          </button>

          <button
            type="button"
            disabled={imageUploadingLoader}
            className="absolute top-3 right-[70px] p-2 !rounded bg-blue-500 shadow-lg text-white cursor-pointer"
            onClick={() => {
              const imageUrl = images[index]?.file_url;

              if (!imageUrl) return;

              const cleanUrl = imageUrl.split('?')[0];

              setBaseImage(cleanUrl);
              setSelectedImage(cleanUrl);
              setActiveEffect(null);
              setOpenImageModal(true);
            }}
          >
            <WandSparkles size={16} />
          </button>
        </>
      ) : (
        <label
          htmlFor={`image-upload-${index}`}
          className="flex flex-col items-center justify-center h-full cursor-pointer"
        >
          <ImageUp size={32} className="mb-2" />
          <p
            className={`text-gray-500 ${small ? 'text-md' : 'text-xl'} font-semibold`}
          >
            {size}
          </p>
          <p
            className={`text-gray-500 ${small ? 'text-sm' : 'text-lg'} pt-2 text-center`}
          >
            Please choose an image <br />
            that matches the aspect ratio.
          </p>
        </label>
      )}

      {imagePreview && (
        <Image
          src={imagePreview}
          alt="Preview"
          width={850}
          height={765}
          className="w-full h-full object-cover rounded-lg"
        />
      )}
    </div>
  );
};

export default ImagePlaceholder;
