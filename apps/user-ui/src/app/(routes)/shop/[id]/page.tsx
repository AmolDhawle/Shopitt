'use server';

import SellerProfile from '@user-ui/shared/modules/seller/seller-profile';
import axiosInstance from '@user-ui/utils/axiosInstance';
import { Metadata } from 'next';
import React from 'react';

async function fetchSellerDetails(id: string) {
  const response = await axiosInstance.get(`/seller/api/get-seller/${id}`);
  return response.data;
}

// Dynamic metadata generator
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id: shopId } = await params;

  const data = await fetchSellerDetails(shopId);

  return {
    title: `${data?.shop?.name} | Shopitt Marketplace`,
    description:
      data?.shop?.bio ||
      'Explore products and services from trusted sellers on Shopitt.',
    openGraph: {
      title: `${data?.shop?.name} | Shopitt Marketplace`,
      description:
        data?.shop?.bio ||
        'Explore products and services from trusted sellers on Shopitt',
      type: 'website',
      images: [
        {
          url: data?.shop?.avatar || '/default-shop.png',
          width: 800,
          height: 600,
          alt: data?.shop?.name || 'Shop Logo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data?.shop?.name} | Shopitt Marketplace`,
      description:
        data?.shop?.bio ||
        'Explore products and services from trusted seller on Shopitt',
      images: [data?.shop?.avatar || '/default-shop.png'],
    },
  };
}

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: shopId } = await params;

  if (!shopId) return <div>Seller ID missing</div>;

  const data = await fetchSellerDetails(shopId);

  return (
    <div>
      <SellerProfile shop={data?.shop} followersCount={data.followersCount} />
    </div>
  );
}

export default Page;
