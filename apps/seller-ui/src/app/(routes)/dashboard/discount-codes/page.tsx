'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeleteDiscountCodeModal from 'apps/seller-ui/src/shared/modals/delete-discount-code';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import { AxiosError } from 'axios';
import { Input } from 'libs/components/src';
import { ChevronRight, Plus, Trash, X } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type DiscountFormValues = {
  publicName: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountCode: string;
  expiresAt?: string;
  usageLimit?: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
};

const Page = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: discountCodes = [], isLoading } = useQuery({
    queryKey: ['shop-discounts'],
    queryFn: async () => {
      const res = await axiosInstance.get('/product/api/get-discount-codes');
      console.log('REsponse', res);
      return res.data?.discounts || [];
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DiscountFormValues>({
    defaultValues: {
      publicName: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      discountCode: '',
      expiresAt: '',
      usageLimit: undefined,
      minimumOrderAmount: undefined,
      maximumDiscountAmount: undefined,
      applicableProducts: [],
      applicableCategories: [],
    },
  });

  const createDiscountCodeMutation = useMutation<
    void,
    Error,
    DiscountFormValues
  >({
    mutationFn: async (data: DiscountFormValues) => {
      await axiosInstance.post('/product/api/create-discount-code', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-discounts'] });
      reset();
      setShowModal(false);
    },
  });

  const deleteDiscountCodeMutatation = useMutation({
    mutationFn: async (discountId: string) => {
      await axiosInstance.delete(
        `/product/api/delete-discount-code/${discountId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-discounts'] });
      setShowDeleteModal(false);
    },
  });

  const handleDeleteClick = async (discount: any) => {
    setSelectedDiscount(discount);
    setShowDeleteModal(true);
  };

  const onSubmit = (data: DiscountFormValues) => {
    if (discountCodes.length >= 8) {
      toast.error('You can only create upto 8 discount codes.');
      return;
    }

    const payload = {
      ...data,
      discountValue: Number(data.discountValue),
      usageLimit: Number(data.usageLimit),
      minimumOrderAmount: Number(data.minimumOrderAmount),
      maximumDiscountAmount: Number(data.maximumDiscountAmount),
    };

    createDiscountCodeMutation.mutate(payload);
  };

  return (
    <div className="w-full min-h-screen p-8">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl text-white font-semibold">Discount Codes</h2>
        <button
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} /> Create Discount
        </button>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center text-white">
        <Link href={'/dashboard'} className="text-[#80Deea] cursor-pointer">
          Dashboard
        </Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>Discount Codes</span>
      </div>

      <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          Your Discount Codes
        </h3>
        {isLoading ? (
          <p className="text-gray-400 text-center">Loading discounts...</p>
        ) : (
          <table className="w-full text-white text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Code</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Value</th>
                <th className="p-3 text-left">Min Order</th>
                <th className="p-3 text-left">Max Discount</th>
                <th className="p-3 text-left">Usage</th>
                <th className="p-3 text-left">Expires</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discountCodes?.map((discount: any) => {
                const isExpired =
                  discount.expiresAt &&
                  new Date(discount.expiresAt) < new Date();

                const isUsageLimitReached =
                  discount.usageLimit &&
                  discount.usedCount >= discount.usageLimit;

                const status = isExpired
                  ? 'Expired'
                  : isUsageLimitReached
                    ? 'Limit Reached'
                    : 'Active';

                return (
                  <tr
                    key={discount?.id}
                    className="border-b border-gray-800 hover:bg-gray-800 transition"
                  >
                    <td className="p-3">{discount.publicName}</td>

                    <td className="p-3 font-mono text-cyan-400">
                      {discount.discountCode}
                    </td>

                    <td className="p-3 capitalize">
                      {discount.discountType === 'PERCENTAGE'
                        ? 'Percentage'
                        : 'Flat'}
                    </td>

                    <td className="p-3">
                      {discount.discountType === 'PERCENTAGE'
                        ? `${discount.discountValue}%`
                        : `₹${discount.discountValue}`}
                    </td>

                    <td className="p-3">
                      {discount.minimumOrderAmount
                        ? `₹${discount.minimumOrderAmount}`
                        : '-'}
                    </td>

                    <td className="p-3">
                      {discount.maximumDiscountAmount
                        ? `₹${discount.maximumDiscountAmount}`
                        : '-'}
                    </td>

                    <td className="p-3">
                      {discount.usedCount || 0}
                      {discount.usageLimit ? ` / ${discount.usageLimit}` : ''}
                    </td>

                    <td className="p-3">
                      {discount.expiresAt
                        ? new Date(discount.expiresAt).toLocaleDateString()
                        : 'No expiry'}
                    </td>

                    <td
                      className={`p-3 font-semibold ${
                        status === 'Active' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {status}
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => handleDeleteClick(discount)}
                        className="text-red-300 hover:text-red-500 transition"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!isLoading && discountCodes?.length === 0 && (
          <p className="text-gray-400 w-full pt-4 block text-center">
            No discount codes available
          </p>
        )}
      </div>

      {/* Create discount modal */}
      {showModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-xl text-white">Create Discount Code</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
              {/* Title */}
              <Input
                label="Title (Public Name)"
                {...register('publicName', { required: 'Title is required' })}
                className="text-white bg-gray-900"
              />
              {errors.publicName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.publicName.message}
                </p>
              )}

              {/* Discount Type */}
              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Discount Type
                </label>

                <Controller
                  control={control}
                  name="discountType"
                  render={({ field }) => (
                    <div className="relative">
                      <select
                        {...field}
                        className="
                          w-full
                          appearance-none
                          border border-gray-700
                          bg-gray-900
                          text-white
                          px-2 py-2
                          rounded-lg
                          focus:ring-2 focus:ring-blue-500
                          focus:border-blue-500
                          transition
                        "
                      >
                        <option
                          value="PERCENTAGE"
                          className="bg-gray-800 text-white"
                        >
                          Percentage (%)
                        </option>
                        <option
                          value="FIXED"
                          className="bg-gray-800 text-white"
                        >
                          Flat Amount (₹)
                        </option>
                      </select>

                      {/* Custom Arrow */}
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                        ▼
                      </div>
                    </div>
                  )}
                />
              </div>

              {/* Discount Value */}
              <div className="mt-2">
                <Input
                  label="Discount Value"
                  type="number"
                  className="bg-gray-900 text-white"
                  min={1}
                  {...register('discountValue', {
                    required: 'Value is required',
                  })}
                />
                {errors.discountValue && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.discountValue.message}
                  </p>
                )}
              </div>

              {/* Discount Code */}
              <div className="mt-2">
                <Input
                  label="Discount Code"
                  {...register('discountCode', {
                    required: 'Discount Code is required',
                  })}
                  className="bg-gray-900 text-white"
                />
                {errors.discountCode && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.discountCode.message}
                  </p>
                )}
              </div>

              {/* Expiry Date */}
              <div className="mt-2">
                <Input
                  label="Expiry Date"
                  type="date"
                  {...register('expiresAt')}
                  className="bg-gray-900 text-white"
                />
              </div>

              {/* Usage Limit */}
              <div className="mt-2">
                <Input
                  label="Usage Limit"
                  type="number"
                  min={1}
                  {...register('usageLimit')}
                  className="bg-gray-900 text-white"
                />
              </div>

              {/* Minimum Order Amount */}
              <div className="mt-2">
                <Input
                  label="Minimum Order Amount"
                  type="number"
                  min={1}
                  {...register('minimumOrderAmount')}
                  className="bg-gray-900 text-white"
                />
              </div>

              {/* Maximum Discount Amount */}
              <div className="mt-2">
                <Input
                  label="Maximum Discount Amount"
                  type="number"
                  min={1}
                  {...register('maximumDiscountAmount')}
                  className="bg-gray-900 text-white"
                />
              </div>

              {/* Applicable Products */}
              <div className="mt-2">
                <Input
                  label="Applicable Products (comma separated)"
                  {...register('applicableProducts')}
                  className="bg-gray-900 text-white"
                />
              </div>

              {/* Applicable Categories */}
              <div className="mt-2">
                <Input
                  label="Applicable Categories (comma separated)"
                  {...register('applicableCategories')}
                  className="bg-gray-900 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={createDiscountCodeMutation.isPending}
                className="mt-4 w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-md font-semibold flex justify-center items-center gap-2"
              >
                <Plus size={18} />{' '}
                {createDiscountCodeMutation?.isPending
                  ? 'Creating ...'
                  : 'Create'}
              </button>
              {createDiscountCodeMutation.isError && (
                <p className="text-red-500 text-sm mt-2">
                  {(
                    createDiscountCodeMutation.error as AxiosError<{
                      message: string;
                    }>
                  )?.response?.data?.message || 'Something went wrong'}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete discount code */}
      {showDeleteModal && selectedDiscount && (
        <DeleteDiscountCodeModal
          discount={selectedDiscount}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async () =>
            await deleteDiscountCodeMutatation.mutate(selectedDiscount?.id)
          }
        />
      )}
    </div>
  );
};

export default Page;
