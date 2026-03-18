'use client';
import { Search } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import ProfileIcon from '../../assets/svgs/profile-icon';
import {
  CartIconFilled,
  CartIconOutline,
} from '../../assets/svgs/shopping-cart-icon';
import {
  HeartIconFilled,
  HeartIconOutline,
} from '../../assets/svgs/heart-icon';
import HeaderBottom from './header-bottom';
import { useStore } from '../../store';
import { capitalize } from '../../utils/capitalize';
import { useAuthStore } from '@user-ui/store/authStore';

const Header = () => {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);

  return (
    <div className="w-full">
      <div className="bg-[#2874f0]">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <Link href="/">
              <span className="text-xl md:text-3xl text-white font-bold">
                Shopitt
              </span>
            </Link>
          </div>
          <div className="hidden md:block w-[50%] relative">
            <input
              type="text"
              placeholder="Search for products ..."
              className="w-full px-4 font-Poppins font-normal border-[2.5px] border-[#fcd603] h-[60px] rounded-md outline-none"
            />
            <div className="w-[60px] cursor-pointer flex items-center justify-center h-[60px] border-[2.5px] border-[#fcd603] absolute right-0 top-0 rounded-md bg-[#fcd603]">
              <Search color="white" />
            </div>
          </div>
          <div className="flex justify-between gap-2 md:gap-8">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                {!isLoading && user ? (
                  <>
                    <Link href="/profile">
                      <ProfileIcon />
                    </Link>
                    <Link href="/profile">
                      <span className="block text-lg text-white font-medium cursor-pointer">
                        Hello,
                      </span>
                      <span className="text-lg text-white font-medium cursor-pointer">
                        {isLoading
                          ? '...'
                          : capitalize(user?.name?.split(' ')[0])}
                      </span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <ProfileIcon />
                    </Link>
                    <Link href="/login">
                      <span className="block text-lg text-white font-medium cursor-pointer">
                        Hello,
                      </span>
                      <span className="text-lg text-white font-medium cursor-pointer">
                        {isLoading ? '...' : 'Sign in'}
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/wishlist" className="hidden md:block relative">
                <HeartIconOutline size={24} stroke="white" />
                <div className="w-4 h-4 border-none bg-red-500 rounded-full flex items-center justify-center absolute right-[-6px] top-[-4px]">
                  <span className="text-white font-medium text-sm text-center">
                    {wishlist?.length}
                  </span>
                </div>
              </Link>
              <Link href="/cart" className="relative">
                <CartIconOutline size={24} stroke="white" />
                <div className="w-4 h-4 border-none bg-red-500 rounded-full flex items-center justify-center absolute right-[-6px] top-[-4px]">
                  <span className="text-white font-medium text-sm text-center">
                    {cart?.length}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-b-sky-300 " />
      <HeaderBottom />
    </div>
  );
};

export default Header;
