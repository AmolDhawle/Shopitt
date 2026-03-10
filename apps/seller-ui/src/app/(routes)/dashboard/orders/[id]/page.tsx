'use client';

import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const statuses = [
  'ORDER_PLACED',
  'PAYMENT_CONFIRMED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

const formatStatus = (status: string) =>
  status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());

const OrderDetails = () => {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const fetchOrder = async () => {
    try {
      const res = await axiosInstance.get(
        `/order/api/get-order-details/${orderId}`,
      );
      setOrder(res.data.order);
    } catch (error) {
      console.error('Failed to fetch order details', error);
    } finally {
      setLoading(false);
    }
  };

  console.log('Order', order);

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newStatus = e.target.value;
    setUpdating(true);

    try {
      await axiosInstance.put(`/order/api/update-status/${order.id}`, {
        status: newStatus,
      });
      await fetchOrder(); // refetch to stay synced
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[40vh]">
        <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-center text-sm text-red-500">Order not found.</p>;
  }

  const completedStatuses =
    order.statusHistory?.map((s: any) => s.status) || [];
  const currentStatus = completedStatuses[completedStatuses.length - 1];
  const currentIndex = statuses.indexOf(currentStatus);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Back Button */}
      <div className="my-4">
        <span
          className="text-white flex items-center gap-2 font-semibold cursor-pointer"
          onClick={() => router.push('/dashboard/orders')}
        >
          <ArrowLeft />
          Go Back to Dashboard
        </span>
      </div>

      {/* Order Title */}
      <h1 className="text-2xl font-bold text-gray-200 mb-6">
        Order #{order.id.slice(-6)}
      </h1>

      {/* Status Selector */}
      <div className="mb-8">
        <label className="text-sm font-medium text-gray-300 mr-3">
          Update Order Status:
        </label>
        <select
          value={currentStatus}
          onChange={handleStatusChange}
          disabled={updating}
          className={`border bg-transparent text-gray-200 border-gray-300 rounded-md px-2 py-1
    ${updating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
  `}
        >
          {statuses.map((status, index) => (
            <option
              key={status}
              value={status}
              disabled={index < currentIndex}
              className={`${index < currentIndex ? 'text-gray-500 bg-gray-900' : 'text-gray-200 bg-gray-900'}`}
            >
              {formatStatus(status)}
            </option>
          ))}
        </select>
      </div>

      {/* Progress Timeline */}
      <div className="mb-10 relative">
        {/* Full gray line */}
        <div className="absolute top-4 left-4 right-4 h-1 bg-gray-600 z-0"></div>

        {/* Filled line */}
        <div
          className="absolute top-4 h-1 bg-green-500 z-0 transition-all duration-500"
          style={{
            left: '4px',
            width: `${(currentIndex / (statuses.length - 1)) * 100}%`,
          }}
        ></div>

        {/* Steps */}
        <div className="flex justify-between relative z-10">
          {statuses.map((step, index) => {
            const completed = index <= currentIndex;
            const current = index === currentIndex;

            return (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold
                    ${
                      completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : current
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-gray-700 border-gray-500 text-gray-300'
                    }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-[11px] mt-2 text-center w-24
                    ${completed ? 'text-green-400' : current ? 'text-blue-400' : 'text-gray-400'}
                  `}
                >
                  {formatStatus(step)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary */}
      <div className="mb-6 space-y-2 text-sm text-gray-200">
        <p>
          <span className="font-semibold">Payment Status:</span>{' '}
          <span className="text-green-600 font-medium">
            {order.paymentStatus}
          </span>
        </p>

        <p>
          <span className="font-semibold">Total Paid:</span> ₹{' '}
          {order.total.toFixed(2)}
        </p>

        {order.discount > 0 && (
          <p>
            <span className="font-semibold">Discount Applied:</span>{' '}
            <span className="text-gray-400">-₹{order.discount.toFixed(2)}</span>
          </p>
        )}

        {order.couponCode && (
          <p>
            <span className="font-semibold">Coupon Used:</span>{' '}
            <span className="text-blue-400">{order.couponCode.publicName}</span>
          </p>
        )}

        <p>
          <span className="font-semibold">Date:</span>{' '}
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <div className="mb-8 text-sm text-gray-300">
          <h2 className="text-md font-semibold mb-2">Shipping Address</h2>
          <p>{order.shippingAddress.line1}</p>
          <p>
            {order.shippingAddress.line2}, {order.shippingAddress.city},{' '}
            {order.shippingAddress.postalCode}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
      )}

      {/* Order Items */}
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-4">
          Order Items
        </h2>

        <div className="space-y-4">
          {order.items.map((item: any) => (
            <div
              key={item.id}
              className="border border-gray-700 rounded-md p-4 flex items-center gap-4"
            >
              <img
                src={item.product?.images?.[0]?.url}
                alt={item.product?.title || 'Product image'}
                className="w-16 h-16 object-cover rounded-md border border-gray-600"
              />

              <div className="flex-1">
                <p className="font-medium text-gray-200">
                  {item.product?.title || 'Unnamed Product'}
                </p>

                <p className="text-sm text-gray-300">
                  Quantity: {item.quantity}
                </p>

                {item.selectedOptions &&
                  Object.keys(item.selectedOptions).length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {Object.entries(item.selectedOptions).map(
                        ([key, value]: [string, any]) =>
                          value && (
                            <span key={key} className="mr-3">
                              <span className="font-medium capitalize">
                                {key}
                              </span>{' '}
                              {value}
                            </span>
                          ),
                      )}
                    </div>
                  )}
              </div>

              <p className="text-sm font-semibold text-gray-200">
                ₹{item.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
