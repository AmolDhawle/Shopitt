'use client';

import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';
import useLocationTracking from 'apps/user-ui/src/hooks/useLocationTracking';
import useUser from 'apps/user-ui/src/hooks/useUser';
import { useStore } from 'apps/user-ui/src/store';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

const Wishlist = () => {
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const addToCart = useStore((state: any) => state.addToCart);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
  const wishlist = useStore((state: any) => state.wishlist);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  console.log('Add to cart', addToCart);

  const decreaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      wishlist: state.wishlist.map((item: any) => {
        if (item.id === id && item.quantity > 1) {
          if (item.quantity <= item.stock + 1) {
            setIsDisabled(false);
            setWarningMessage(null);
          }
          return { ...item, quantity: item.quantity - 1 };
        } else {
          return item;
        }
      }),
    }));
  };

  const increaseQuantity = (id: string) => {
    useStore.setState((state: any) => {
      const updatedWishlist = state.wishlist.map((item: any) => {
        if (item.id === id) {
          if (item.quantity >= item.stock) {
            setIsDisabled(true);
            setWarningMessage(`Only ${item.stock} items left in the stock`);
          } else {
            setIsDisabled(false);
            setWarningMessage(null);
          }
          return { ...item, quantity: item.quantity + 1 };
        }
      });

      return {
        wishlist: updatedWishlist,
      };
    });
  };

  const removeItem = (id: string) => {
    removeFromWishlist(id, user, location, deviceInfo);
  };
  return (
    <div className="w-full bg-white">
      <div className="md:w-[80%] w-[95%] mx-auto min-h-screen ">
        {/* Breadcrumbs */}
        <div className="pb-[50px]">
          <h1 className="md:pt-[50px] font-medium text-[44px] leading-[1] mb-[16px]">
            Wishlist
          </h1>
          <Link href={'/'} className="text-[#55585b] hover:underline">
            Home
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acbo] rounded-full">
            .
          </span>
          <span className="text-[#55585b]">Wishlist</span>
        </div>
        {/* If wishlist is empty */}
        {wishlist.length === 0 ? (
          <div className="text-center text-gray-600 text-lg">
            Your wishlist is empty! Start adding products.
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* Wishlist items table */}
            <table className="w-full border-collapse">
              <thead className="bg-[#f1f3f4]">
                <tr>
                  <th className="py-3 text-left pl-4">Product</th>
                  <th className="py-3 text-left">Price</th>
                  <th className="py-3 text-left">Quantity</th>
                  <th className="py-3 text-left">Action</th>
                  <th className="py-3 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {wishlist?.map((item: any) => (
                  <tr key={item?.id} className="border-b border-b-[#0000000e]">
                    <td className="flex items-center gap-3 p-4">
                      <Image
                        src={item?.images[0]?.url}
                        alt={item?.title}
                        width={80}
                        height={80}
                        className="rounded"
                      />
                      <span>{item?.title}</span>
                    </td>
                    <td className="text-left pr-6 text-lg">
                      ₹{item?.salePrice.toFixed(2)}
                    </td>
                    <td>
                      <div className="flex items-center justify-center border border-gray-200 rounded-[20px] w-[90px] p-[2px]">
                        <button
                          className="text-black cursor-pointer text-xl"
                          onClick={() => decreaseQuantity(item?.id)}
                        >
                          -
                        </button>
                        <span className="px-4">{item.quantity}</span>
                        <button
                          className="text-black cursor-pointer text-xl"
                          onClick={() => increaseQuantity(item?.id)}
                        >
                          +
                        </button>
                      </div>
                      {warningMessage && (
                        <span className="text-center self-end text-red-500 mt-1">
                          {warningMessage}
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        disabled={isDisabled}
                        className={`  text-white px-5 py-2 rounded-md  transition-all ${isDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#2295FF] hover:bg-[#007bff] cursor-pointer transition duration-200'}`}
                        onClick={() =>
                          addToCart(item, user, location, deviceInfo)
                        }
                      >
                        Add To Cart
                      </button>
                    </td>
                    <td>
                      <button
                        className="relative group text-[#ff1826] cursor-pointer transition duration-200"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 size={20} />

                        {/* Tooltip */}
                        <span
                          className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2
                            bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100
                            pointer-events-none whitespace-nowrap transition-opacity duration-200"
                        >
                          Remove from wishlist
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
