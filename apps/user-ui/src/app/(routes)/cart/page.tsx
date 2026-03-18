'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@user-ui/store/authStore';
import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';
import useLocationTracking from 'apps/user-ui/src/hooks/useLocationTracking';
import { useStore } from 'apps/user-ui/src/store';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const CartPage = () => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const cart = useStore((state: any) => state.cart);
  const [discountedProductId, setDiscountedProductId] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [selectedAddressId, setSelectedAddressid] = useState('');
  const [error, setError] = useState('');
  const [storedCouponCode, setStoredCouponCode] = useState('');
  const removeFromCart = useStore((state: any) => state.removeFromCart);

  const couponCodeApplyHandler = async () => {
    setError('');

    if (!couponCode.trim()) {
      setError('Coupon code is required!');
      return;
    }

    try {
      const res = await axiosInstance.put('/order/api/verify-coupon', {
        couponCode: couponCode.trim(),
        cart,
      });

      if (res.data.valid) {
        setStoredCouponCode(couponCode.trim());
        setDiscountAmount(parseFloat(res.data.discountAmount));
        setDiscountPercent(res.data.discount);
        setDiscountedProductId(res.data.discountedProductId);
        setCouponCode('');
      } else {
        setDiscountAmount(0);
        setDiscountPercent(0);
        setDiscountedProductId('');
        setError(
          res.data.message || 'Coupon not valid for any items in the cart',
        );
      }
    } catch (error: any) {
      setDiscountAmount(0);
      setDiscountPercent(0);
      setDiscountedProductId('');
      setError(error?.response?.data?.message);
    }
  };

  const createPaymentSession = async () => {
    if (addresses?.length === 0) {
      toast.error('Please set your delivery address to create an order!');
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.post(
        '/order/api/create-payment-session',
        {
          cart,
          selectedAddressId,
          couponCode: {
            code: storedCouponCode,
            discountAmount,
            discountPercent,
            discountedProductId,
          },
        },
      );
      const sessionId = res.data.sessionId;
      router.push(`/checkout?sessionId=${sessionId}`);
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const decreaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      ),
    }));
  };

  const increaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id && item.quantity < item.stock
          ? { ...item, quantity: (item.quantity ?? 1) + 1 }
          : item,
      ),
    }));
  };

  const removeItem = (id: string) => {
    removeFromCart(id, user, location, deviceInfo);
  };

  const subTotal = cart.reduce(
    (total: number, item: any) => total + item.quantity * item.salePrice,
    0,
  );

  // Get addresses
  const { data: addresses } = useQuery({
    queryKey: ['shipping-addresses'],
    queryFn: async () => {
      const res = await axiosInstance.get('/user/api/shipping-addresses');
      return res.data.addresses;
    },
  });

  useEffect(() => {
    if (addresses?.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((addr: any) => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddressid(defaultAddr.id);
      }
    }
  }, [addresses, selectedAddressId]);

  return (
    <div className="w-full bg-white">
      <div className="w-[95%] md:[w-80%] mx-auto min-h-screen">
        <div className="pb-[50px]">
          <h1 className="md:pt-[50px] font-medium text-[44px] leading-1 mb-4 ">
            Shopping Cart
          </h1>
          <Link href={'/'} className="text-[#55585b] hover:underline">
            Home
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acbo] rounded-full">
            .
          </span>
          <span className="text-[#55585b]">Cart</span>
        </div>

        {/* If cart is empty */}
        {cart.length === 0 ? (
          <div className="text-center text-gray-600 text-lg">
            Your cart is empty! Start adding products.
          </div>
        ) : (
          <div className="lg:flex items-start gap-10">
            <table className="w-full lg:w-[70%] border-collapse">
              <thead className="bg-[#f1f5f4] rounded">
                <tr>
                  <th className="py-3 text-left pl-6 align-middle">Products</th>
                  <th className="py-3 text-left align-middle">Price</th>
                  <th className="py-3 text-left align-middle">Quantity</th>
                  <th className="py-3 text-left align-middle"></th>
                </tr>
              </thead>
              <tbody>
                {cart?.map((item: any) => (
                  <tr key={item.id} className="border-b border-b-[#0000000e]">
                    <td className=" p-4 pl-6">
                      <div className="flex items-center gap-4">
                        <Image
                          src={item?.images[0]?.url}
                          alt={item.title}
                          width={80}
                          height={80}
                          className="rounded"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{item.title}</span>
                          {item?.selectedOptions && (
                            <div className="text-sm text-gray-500">
                              {item.selectedOptions?.color && (
                                <span>
                                  Color: {}
                                  <span
                                    style={{
                                      backgroundColor:
                                        item?.selectedOptions?.color,
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '100%',
                                      display: 'inline-block',
                                    }}
                                  />
                                </span>
                              )}
                              {item?.selectedOptions.size && (
                                <span className="ml-2">
                                  Size: {item?.selectedOptions?.size}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="pr-6  text-lg text-left">
                      {item?.id === discountedProductId ? (
                        <div className="flex flex-col items-center">
                          <span className="line-through text-gray-500 text-sm text-left">
                            ₹{item.salePrice.toFixed(2)}
                          </span>
                          <span className="text-green-600 font-semibold">
                            ₹{' '}
                            {(
                              (item.salePrice * (100 - discountPercent)) /
                              100
                            ).toFixed(2)}
                          </span>
                          <span className="text-xs text-green-700 bg-gray-500">
                            Discount Applied
                          </span>
                        </div>
                      ) : (
                        <span className="">₹{item.salePrice.toFixed(2)}</span>
                      )}
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
                    </td>
                    <td className="text-left">
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
                          Remove from cart
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-6 shadow-md w-full lg:w-[30%] bg-[#f9f9ff9] rounded-lg">
              {discountAmount > 0 && (
                <div className="flex justify-center text-[#010f1c] text-base font-medium pb-1">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="text-green-600">
                    - ₹{discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                <span className="font-jost">Subtotal</span>
                <span>₹{(subTotal - discountAmount).toFixed(2)}</span>
              </div>
              <hr className="my-4 text-slate-200" />

              <div className="mb-4">
                <h4 className="mb-[7px] font-[500] text-[15px]">
                  Have a coupon code ?
                </h4>
                <div className="flex">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e: any) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="w-full p-2 border border-gray-200 rounded-l-md focus:outline-none focus:border-blue-500"
                  />
                  <button
                    className="bg-blue-500 cursor-pointer text-white px-4 rounded-r-md hover:bg-blue-600 transition-all"
                    onClick={() => couponCodeApplyHandler()}
                  >
                    Apply
                  </button>
                </div>
                {error && <p className="text-sm pt-2 text-red-500">{error}</p>}
                <hr className="my-4 text-slate-200" />

                <div className="mb-4">
                  <h4 className="mb-[7px] font-medium text-[15px]">
                    Select shipping address
                  </h4>
                  {addresses?.length !== 0 && (
                    <select
                      className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressid(e.target.value)}
                    >
                      {addresses?.map((address: any) => (
                        <option key={address.id} value={address.id}>
                          {address.label} - {address.city}, {address.country}
                        </option>
                      ))}
                    </select>
                  )}
                  {addresses?.length === 0 && (
                    <p className="text-sm text-slate-800">
                      Please add an address from profile to create an order!
                    </p>
                  )}
                </div>
                <hr className="my-4 text-slate-200" />
                <div className="mb-4">
                  <h4 className="mb-[7px] font-[500] text-[15px]">
                    Select Payment Method
                  </h4>
                  <select
                    name=""
                    id=""
                    className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="cash_on_delivery">Cash On Delivery</option>
                  </select>
                </div>
                <hr className="my-4 text-slate-200" />
                <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                  <span className="font-jost">Total</span>
                  <span>₹{(subTotal - discountAmount).toFixed(2)}</span>
                </div>
                <button
                  disabled={loading}
                  onClick={createPaymentSession}
                  className="w-full flex items-center justify-center gap-2 cursor-pointer mt-4 py-3 bg-[#010f1c] text-white hover:bg-[#0989FF] transition-all rounded-lg"
                >
                  {loading && <Loader2 className="animate-spin w-5 h-5" />}
                  {loading ? 'Redirecting...' : 'Proceed to checkout'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
