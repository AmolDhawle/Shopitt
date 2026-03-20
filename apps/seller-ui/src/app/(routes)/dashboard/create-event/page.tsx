'use client';

import React, { useState } from 'react';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Percent, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@seller-ui/store/authStore';
import { EventCountdown } from '@shopitt/components';

const fetchProducts = async () => {
  const res = await axiosInstance.get('/product/api/get-shop-products');
  return res?.data?.products;
};

const CreateEventPage = () => {
  const seller = useAuthStore((s) => s.seller);
  const shopId = seller?.shopId;

  const queryClient = useQueryClient();

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [form, setForm] = useState({
    startingDate: '',
    endingDate: '',
    discountPercentage: 10,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['shop-products'],
    queryFn: fetchProducts,
  });

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const mutation = useMutation({
    mutationFn: async () => {
      return axiosInstance.post(`/product/api/create-event/${shopId}`, {
        productIds: selectedProducts,
        ...form,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      setSelectedProducts([]);
    },
  });

  const isFormValid =
    form.startingDate &&
    form.endingDate &&
    selectedProducts.length > 0 &&
    form.discountPercentage > 0 &&
    form.discountPercentage <= 100;

  const now = new Date();

  return (
    <div className="w-full min-h-screen p-8 bg-black text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold">Create Event</h2>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center mb-6 text-sm">
        <Link href="/dashboard" className="text-blue-400">
          Dashboard
        </Link>
        <ChevronRight size={16} className="mx-2" />
        <span>Create Event</span>
      </div>

      {/* Event Form */}
      <div className="bg-gray-900 p-5 rounded-xl mb-6 border border-gray-800">
        <h3 className="text-lg font-medium mb-4">Event Settings</h3>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Start Date */}
          <div>
            <label className="text-sm text-gray-400 mb-1 flex items-center gap-1">
              <Calendar size={14} /> Start Date
            </label>
            <input
              type="datetime-local"
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              onChange={(e) =>
                setForm({ ...form, startingDate: e.target.value })
              }
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-sm text-gray-400 mb-1 flex items-center gap-1">
              <Calendar size={14} /> End Date
            </label>
            <input
              type="datetime-local"
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              onChange={(e) => setForm({ ...form, endingDate: e.target.value })}
            />
          </div>

          {/* Discount */}
          <div>
            <label className="text-sm text-gray-400 mb-1 flex items-center gap-1">
              <Percent size={14} /> Discount %
            </label>
            <input
              type="number"
              value={form.discountPercentage}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              onChange={(e) =>
                setForm({
                  ...form,
                  discountPercentage: Number(e.target.value),
                })
              }
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="mt-6">
          <label className="text-md font-semibold text-gray-200 mb-1 flex items-center gap-1">
            Select Products
          </label>
          {isLoading ? (
            <p className="text-center">Loading products...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {products.map((product: any) => {
                const isSelected = selectedProducts.includes(product.id);
                const start = product.startingDate
                  ? new Date(product.startingDate)
                  : null;
                const end = product.endingDate
                  ? new Date(product.endingDate)
                  : null;
                const isUpcoming = start && start > now;
                const isActive = start && end && start <= now && end >= now;
                const isExpired = end && end < now;
                const isDisabled = isActive || isUpcoming;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isDisabled && toggleProduct(product.id)}
                    className={`relative border rounded-xl overflow-hidden transition ${
                      isSelected ? 'border-purple-500' : 'border-gray-800'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-purple-400'}`}
                  >
                    {/* Image */}
                    <Image
                      src={product.images[0]?.url}
                      alt={product.title}
                      width={300}
                      height={200}
                      className="w-full h-32 object-cover"
                    />

                    {/* Info */}
                    <div className="p-3">
                      <h4 className="text-sm font-medium truncate">
                        {product.title}
                      </h4>
                      <p className="text-xs text-gray-400">
                        ₹{product.salePrice}
                      </p>
                      {isActive && product.endingDate && (
                        <EventCountdown endDate={product.endingDate} />
                      )}
                    </div>

                    {/* Badges */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-purple-600 text-xs px-2 py-1 rounded">
                        Selected
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute top-2 left-2 bg-green-600 text-xs px-2 py-1 rounded">
                        Live
                      </div>
                    )}
                    {isUpcoming && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-xs px-2 py-1 rounded">
                        Upcoming
                      </div>
                    )}
                    {isExpired && (
                      <div className="absolute top-2 left-2 bg-gray-600 text-xs px-2 py-1 rounded">
                        Expired
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action */}
        <div className="flex justify-between items-center mt-5">
          <p className="text-sm text-gray-400">
            {selectedProducts.length} products selected
          </p>
          <button
            disabled={!isFormValid || mutation.isPending}
            onClick={() => mutation.mutate()}
            className={`px-5 py-2 rounded-lg transition ${
              isFormValid
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-700 cursor-not-allowed'
            }`}
          >
            {mutation.isPending ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;
