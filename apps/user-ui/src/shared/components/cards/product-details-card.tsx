import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import Rating from '../rating';
import { Heart, MapPin, MessageCircleMore, ShoppingBag, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductDetailsCardProps {
  data: any;
  setOpen: (open: boolean) => void;
  user: any;
  location: any;
  deviceInfo: any;
  addToCart: (product: any, user: any, location: any, deviceInfo: any) => void;
  addToWishlist: (
    product: any,
    user: any,
    location: any,
    deviceInfo: any,
  ) => void;
  removeFromWishlist: (
    product: any,
    user: any,
    location: any,
    deviceInfo: any,
  ) => void;
  isWishlisted: boolean;
  isInCart: boolean;
}

const ProductDetailsCard: React.FC<ProductDetailsCardProps> = ({
  data,
  setOpen,
  user,
  location,
  deviceInfo,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  isWishlisted,
  isInCart,
}) => {
  const [activeImage, setActiveImage] = useState(0);
  const [isSelected, setIsSelected] = useState(data?.colors?.[0] || '');
  const [isSizeSelected, setIsSizeSelected] = useState(data?.sizes?.[0] || '');
  const [quantity, setQuantity] = useState(1);

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
  const router = useRouter();
  return (
    <div
      className="fixed flex items-center justify-center inset-0 w-full bg-[#0000001d] z-50"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-[90%] md:w-[70%] md:mt-14 2xl:mt-0 overflow-y-auto scrollbar-hide max-h-[80vh] p-4 md:p-6 bg-white shadow-md rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 h-full">
            <div className="w-full h-[400px] flex items-center justify-center">
              <Image
                src={data?.images?.[activeImage]?.url}
                alt={data?.images?.[activeImage]?.url}
                width={400}
                height={400}
                className="max-h-[400px] w-auto object-contain rounded-lg"
              />
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 mt-4">
              {data?.images?.map((img: any, index: number) => (
                <div
                  key={index}
                  className={`relative w-20 h-20 cursor-pointer rounded-md overflow-hidden border 
                    ${activeImage === index ? 'border-gray-500' : 'border-transparent'}`}
                  onClick={() => setActiveImage(index)}
                >
                  <Image
                    src={img?.url}
                    alt={`Thumbnail ${index}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-1/2 md:pl-8 mt-6 md:mt-0">
            {/* Seller Info */}
            <div className="border-b relative pb-3 border-gray-200 flex items-center justify-between">
              <div className="flex items-start gap-3">
                {/* Shop Logo */}
                <Image
                  src={
                    data?.shop?.avatar ||
                    'https://ik.imagekit.io/5frbx53sr/products/product-1771350318139_vdac8Fu_5.jpg?updatedAt=1771350320408'
                  }
                  alt="Shop Logo"
                  width={60}
                  height={60}
                  className="rounded-full w-[60px] h-[60px] object-cover"
                />
                <div>
                  <Link
                    href={`/shop/${data?.shop?.id}`}
                    className="text-lg font-medium"
                  >
                    {data?.shop?.name}
                  </Link>
                  {/* Shop Ratings */}
                  <span className="block ">
                    <Rating value={data?.shop?.ratings} />
                  </span>

                  {/* Shop Location */}
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <MapPin size={20} />{' '}
                    {data?.shop?.address || 'Location not available'}
                  </p>
                </div>
              </div>
              {/* Chat with seller button */}
              <button
                className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium !rounded hover:scale-105 transition"
                onClick={() => router.push(`/inbox?shopId=${data?.shop?.id}`)}
              >
                <MessageCircleMore size={20} /> Chat with seller
              </button>
              <button className="w-full absolute cursor-pointer right-[-5px] top-[-5px] flex justify-end my-2 mt-[-10px]">
                <X size={25} onClick={() => setOpen(false)} />
              </button>
            </div>
            <h3 className="text-xl font-semibold mt-3">{data?.title}</h3>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap w-full">
              {data?.shortDescription}{' '}
            </p>

            {/* Brand */}
            {data?.brand && (
              <p className="mt-2">
                <strong>Brand: </strong> {data?.brand}
              </p>
            )}

            {/* Color & size selection */}
            <div className="flex flex-col md:flex-row items-start gap-5 mt-4">
              {/* Color options */}
              {data?.colors?.length > 0 && (
                <div>
                  <strong>Color:</strong>
                  <div className="flex gap-2 mt-1">
                    {data?.colors?.map((color: string, index: number) => (
                      <button
                        key={index}
                        className={`w-8 h-8 cursor-pointer rounded-full border-2 transition ${
                          isSelected === color
                            ? 'border-gray-400 scale-110 shadow-md'
                            : 'border-transparent'
                        }`}
                        onClick={() => setIsSelected(color)}
                        style={{ backgroundColor: color }}
                      ></button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size options */}
              {data?.sizes?.length > 0 && (
                <div>
                  <strong>Size: </strong>
                  <div className="flex gap-2 mt-1">
                    {data?.sizes.map((size: string, index: number) => (
                      <button
                        key={index}
                        className={`px-4 py-1 cursor-pointer rounded-md transition ${
                          isSizeSelected === size
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-300 text-black'
                        }`}
                        onClick={() => setIsSizeSelected(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Price Section */}
            <div className="mt-5 flex items-center gap-4">
              <h3 className="text-2xl font-semibold text-gray-900">
                ₹{data?.salePrice}
              </h3>
              {data?.regularPrice && (
                <h3 className="text-lg text-red-600 line-through">
                  ₹{data?.regularPrice}
                </h3>
              )}
            </div>
            <div className="mt-5 flex items-center gap-5">
              <div className="flex items-center rounded-md">
                <button
                  className="px-3  py-1 cursor-pointer bg-gray-300 hover:bg-gray-400 text-black font-semibold rounded-l-md"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  -
                </button>
                <span className="px-4 bg-gray-100 py-1">{quantity}</span>
                <button
                  className="px-3 py-1 cursor-pointer bg-gray-300 hover:bg-gray-400 text-black font-semibold rounded-r-md"
                  onClick={() =>
                    setQuantity((prev) => Math.min(data?.stock, prev + 1))
                  }
                >
                  +
                </button>
              </div>
              <button
                disabled={isInCart}
                className={`flex items-center gap-2 px-4 py-2 bg-[#ff5722] hover:bg-[#e64a19] text-white font-medium rounded-lg transition ${isInCart ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <ShoppingBag size={20} /> Add to cart
              </button>
              <button className="opacity-[.7] cursor-pointer">
                <Heart
                  size={30}
                  fill={isWishlisted ? 'red' : 'transparent'}
                  stroke={isWishlisted ? 'red' : '#4B5563'}
                  onClick={() =>
                    isWishlisted
                      ? removeFromWishlist(data.id, user, location, deviceInfo)
                      : addToWishlist(
                          { ...data, quantity: 1 },
                          user,
                          location,
                          deviceInfo,
                        )
                  }
                />
              </button>
            </div>
            <div className="mt-3">
              {data?.stock > 0 ? (
                <span className="text-green-600 font-semibold">In Stock</span>
              ) : (
                <span className="text-red-600 font-semibold">Out Of Stock</span>
              )}
            </div>
            <div className="mt-3 text-gray-600 text-sm">
              Estimated Delivery:{' '}
              <strong>{estimatedDelivery.toDateString()}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsCard;
