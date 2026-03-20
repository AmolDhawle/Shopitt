'use client';
import { Shops } from '@shopitt/prisma';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sendKafkaEvent } from '@user-ui/actions/track-user';
import useDeviceTracking from '@user-ui/hooks/useDeviceTracking';
import useLocationTracking from '@user-ui/hooks/useLocationTracking';
import { useAuthStore } from '@user-ui/store/authStore';
import axiosInstance from '@user-ui/utils/axiosInstance';
import {
  Clock,
  Heart,
  MapPin,
  Star,
  Users,
  Calendar,
  Globe,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import Youtube from '../../../assets/svgs/youtube.svg';
import ProductCard from '@user-ui/shared/components/cards/product-card';

const TABS = ['Products', 'Offers', 'Reviews'];

const SellerProfile = ({
  shop,
  followersCount,
}: {
  shop: Shops;
  followersCount: number;
}) => {
  const [activeTab, setActiveTab] = useState('Products');
  const [followers, setFollowers] = useState(followersCount);
  const [isFollowing, setIsFollowing] = useState(false);
  const user = useAuthStore((s) => s.user);

  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['seller-products'],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/seller/api/get-seller-products/${shop?.id}?page=1&limit=10`,
      );

      return res.data.products;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    // Synchronize follow status after page reload
    const fetchFollowStatus = async () => {
      if (!shop?.id) return;

      const savedFollowStatus = localStorage.getItem(
        `follow-status-${shop.id}`,
      );
      const savedFollowersCount = localStorage.getItem(
        `followers-count-${shop.id}`,
      );

      // Initialize state from localStorage first
      if (savedFollowStatus !== null) {
        setIsFollowing(JSON.parse(savedFollowStatus));
      }

      if (savedFollowersCount !== null) {
        setFollowers(parseInt(savedFollowersCount));
      } else {
        setFollowers(followersCount);
      }

      // Now fetch the current follow status from the server
      try {
        const res = await axiosInstance.get(
          `seller/api/is-following/${shop?.id}`,
        );

        const serverFollowStatus = res.data.isFollowing;
        if (serverFollowStatus !== null) {
          // If the server's status is different, update the state
          setIsFollowing(serverFollowStatus);
          // Also update localStorage with the server's status
          localStorage.setItem(
            `follow-status-${shop.id}`,
            JSON.stringify(serverFollowStatus),
          );
        }
      } catch (error) {
        console.error('Failed to fetch follow status', error);
      }
    };

    fetchFollowStatus();
  }, [shop?.id, followersCount]);

  const { data: events, isLoading: isEventLoading } = useQuery({
    queryKey: ['seller-events'],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/seller/api/get-seller-events/${shop?.id}?page=1&limit=10`,
      );

      return res.data.events;
    },
    staleTime: 1000 * 60 * 5,
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await axiosInstance.post('/seller/api/unfollow-shop', {
          shopId: shop?.id,
        });
      } else {
        await axiosInstance.post('/seller/api/follow-shop', {
          shopId: shop?.id,
        });
      }
    },

    onSuccess: () => {
      // Flip state only after successful request
      if (isFollowing) {
        setFollowers(followers - 1);
      } else {
        setFollowers(followers + 1);
      }

      setIsFollowing((prev) => !prev);

      // Save updated follow status and follower count to localStorage
      localStorage.setItem(
        `follow-status-${shop.id}`,
        JSON.stringify(!isFollowing),
      );
      localStorage.setItem(
        `followers-count-${shop.id}`,
        JSON.stringify(followers + (isFollowing ? -1 : 1)),
      );

      queryClient.invalidateQueries({
        queryKey: ['is-following', shop?.id],
      });
    },
    onError: () => {
      console.error('Failed to follow/unfollow the shop.');
    },
  });

  useEffect(() => {
    if (!isLoading) {
      if (!location || !deviceInfo || !user?.id) return;

      sendKafkaEvent({
        userId: user?.id,
        shopId: shop?.id,
        action: 'shop_visit',
        country: location?.country || 'Unknown',
        city: location?.city || 'Unknown',
        device: deviceInfo || 'Unknown Device',
      });
    }
  }, [location, deviceInfo, isLoading]);

  return (
    <div>
      <div className="relative w-full flex justify-center">
        <Image
          src={
            shop?.coverBanner ||
            'https://ik.imagekit.io/5frbx53sr/coverBanner/coverbanner.jpeg?updatedAt=1772470391693'
          }
          alt="Shop cover"
          className="w-full h-[400px] object-cover"
          width={1200}
          height={300}
        />
      </div>

      {/* Seller info section */}
      <div className="w-[85%] lg:w-[70%] mt-[-50px] mx-auto relative z-20 flex flex-col lg:flex-row gap-6 ">
        <div className="bg-gray-200 p-6 rounded-lg shadow-lg flex-1">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="relative w-[100px] h-[100px] rounded-full border-4 border-slate-300 overflow-hidden ">
              <Image
                src={'https://ik.imagekit.io/5frbx53sr/avatar/shop-avatar.jpeg'}
                alt="Seller Avatar"
                layout="fill"
                objectFit="cover"
              />
            </div>

            <div className="flex-1 w-full">
              <h1 className="text-2xl font-semibold text-slate-900">
                {shop?.name}
              </h1>

              <p className="text-slate-800 text-sm mt-1">
                {shop?.bio || 'No bio available.'}
              </p>

              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center text-blue-400 gap-1">
                  <Star fill="#60a5fa" size={18} />{' '}
                  <span>{shop?.ratings || 'N/A'}</span>
                </div>
                <div className="flex items-center text-slate-700 gap-1">
                  <Users size={18} /> <span>{followers} Followers</span>
                </div>
              </div>

              <div className="flex items-center text-slate-700 gap-3 mt-3">
                <Clock size={18} />
                <span>{shop?.opening_hours || 'Mon - Sat: 9 AM - 6 AM'}</span>
              </div>
              <div className="flex items-center text-slate-700 gap-3 mt-3">
                <MapPin size={18} />{' '}
                <span>{shop?.address || 'No address provided'}</span>
              </div>
            </div>
            <button
              className={`px-4 py-2 h-[40px] rounded-lg font-semibold flex items-center gap-2 text-white ${
                isFollowing
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              onClick={() => toggleFollowMutation.mutate()}
              disabled={toggleFollowMutation.isPending}
            >
              <Heart size={18} />
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          </div>
        </div>

        {/* Shop Details */}
        <div className="bg-gray-200 p-6 rounded-lg  shadow-lg w-full lg:w-[30%]">
          <h2 className="text-xl font-semibold text-slate-900">Shop Details</h2>

          <div className="flex items-center gap-3 mt-3 text-slate-700">
            <Calendar size={18} />
            <span>
              Joined At:{' '}
              {new Intl.DateTimeFormat('en-US').format(
                new Date(shop?.createdAt!),
              )}
            </span>
          </div>

          {shop?.website && (
            <div className="flex items-center gap-3 mt-3 text-slate-700">
              <Globe size={18} />
              <Link
                href={shop?.website}
                className="hover:underline text-blue-600"
              >
                {shop?.website}
              </Link>
            </div>
          )}

          {shop?.socialLinks && shop?.socialLinks.length > 0 && (
            <div className="mt-3">
              <h3 className="text-slate-700 text-lg font-medium">Follow Us:</h3>
              <div className="flex gap-3 mt-2">
                {shop?.socialLinks?.map((link: any, index: number) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-[.9]"
                  >
                    {link.type === 'youtube' && <Youtube />}
                    {link.type === 'x' && <X />}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="w-[85%] lg:w-[70%] mx-auto mt-8 ">
        {/* Tabs */}
        <div className="flex border-b border-gray-300">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 text-lg font-semibold ${
                activeTab === tab
                  ? 'text-slate-800 border-b-2 border-blue-600'
                  : 'text-slate-600'
              } transition`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-gray-200 rounded-lg my-4 text-slate-700">
          {activeTab === 'Products' && (
            <div className="m-auto gap-2 md:gap-4 grid grid-cols-1 p-4 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5">
              {isLoading && (
                <>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[250px] bg-gray-300 animate-pulse rounded-xl "
                    ></div>
                  ))}
                </>
              )}
              {products?.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {products?.length === 0 && (
                <p className="py-2">No products available yet!</p>
              )}
            </div>
          )}
          {activeTab === 'Offers' && (
            <div className="m-auto grid grid-cols-1 p-4 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5">
              {isEventLoading && (
                <>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[250px] bg-gray-300 animate-pulse rounded-xl "
                    ></div>
                  ))}
                </>
              )}
              {events?.map((product: any) => (
                <ProductCard
                  isEvent={true}
                  key={product.id}
                  product={product}
                />
              ))}
              {products.length === 0 && (
                <p className="py-2">No offers available yet!</p>
              )}
            </div>
          )}
          {activeTab === 'Reviews' && (
            <div>
              <p className="text-center py-5">No reviews available yet!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
