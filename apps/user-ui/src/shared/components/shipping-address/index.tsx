'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { countries } from 'apps/user-ui/src/configs/countries';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { MapPin, Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

const ShippingAddressSection = () => {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      label: 'Home',
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
      country: 'India',
      isDefault: false,
    },
  });

  const { mutate: addAddress } = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.post('/user/api/add-address', payload);

      return res.data.address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
      reset();
      setShowModal(false);
    },
  });

  // get addresses
  const { data: addresses, isLoading } = useQuery({
    queryKey: ['shipping-addresses'],
    queryFn: async () => {
      const res = await axiosInstance.get('/user/api/shipping-addresses');
      return res.data.addresses;
    },
  });

  const onSubmit = async (data: any) => {
    addAddress({
      ...data,
      isDefault: data?.isDefault === true,
    });
  };

  const { mutate: deleteAddress } = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/user/api/delete-address/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
    },
  });
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Saved Address</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline"
        >
          <Plus className="w-4 h-4" /> Add New Address
        </button>
      </div>

      {/* Address list */}
      <div>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading Addresses</p>
        ) : !addresses || addresses?.length === 0 ? (
          <p className="text-sm text-gray-500">No addresses found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses?.map((address: any) => (
              <div
                key={address.id}
                className="border border-gray-200 rounded-md p-4 relative"
              >
                {address.isDefault && (
                  <span className="absolute top-2 right-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin className="w-5 h-5 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium">
                      {address.label} - {address.line1}
                    </p>
                    <p>
                      {address.line2}, {address.city}, {address.postalCode},{' '}
                      {address.country}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    className="flex items-center gap-1 cursor-pointer text-xs text-red-600"
                    onClick={() => deleteAddress(address.id)}
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-md shadow-md relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Add New Address
            </h3>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="w-full max-w-xl bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5"
            >
              {/* <h2 className="text-lg font-semibold text-gray-800">
                Add New Address
              </h2> */}

              {/* Label */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Address Type
                </label>
                <select
                  {...register('label')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Address Line 1 */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Address Line 1
                </label>
                <input
                  type="text"
                  {...register('line1', { required: 'Address is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
                {errors.line1 && (
                  <p className="text-red-500 text-xs">{errors.line1.message}</p>
                )}
              </div>

              {/* Address Line 2 */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Address Line 2
                </label>
                <input
                  type="text"
                  {...register('line2', { required: 'Address is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
                {errors.line2 && (
                  <p className="text-red-500 text-xs">{errors.line2.message}</p>
                )}
              </div>

              {/* City + Postal COde Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    {...register('city', { required: 'City is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    {...register('postalCode', {
                      required: 'Postal Code is required',
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-xs">
                      {errors.postalCode.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Country */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Country
                </label>
                <select
                  {...register('country')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  {...register('isDefault', {
                    setValueAs: (value) => Boolean(value),
                  })}
                  className="w-4 h-4 accent-blue-600"
                />
                <label className="text-sm text-gray-700">
                  Set as default address
                </label>
              </div>

              {/* Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition duration-200 shadow-sm"
              >
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingAddressSection;
