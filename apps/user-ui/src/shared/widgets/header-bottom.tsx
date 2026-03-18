'use client';

import { AlignLeft, ChevronDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { navItems } from '../../configs/constants';
import Link from 'next/link';
import ProfileIcon from '../../assets/svgs/profile-icon';
import { HeartIconOutline } from '../../assets/svgs/heart-icon';
import { CartIconOutline } from '../../assets/svgs/shopping-cart-icon';
import { useStore } from '../../store';
import { useAuthStore } from '@user-ui/store/authStore';

const HeaderBottom = () => {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`w-full bg-[#49a6e4] transition-all duration-300 ${
        isSticky ? 'md:fixed top-0 left-0 z-[100] shadow-lg' : 'relative'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-[60px] relative">
          {/* All Categories */}
          <div
            className="w-[60px] md:w-[260px] shrink-0 cursor-pointer flex items-center self-end justify-between px-5 h-[50px] bg-[#fcd603]"
            onClick={() => setShow(!show)}
          >
            <div className="flex items-center gap-2">
              <AlignLeft color="white" />
              <span className="text-white font-medium hidden md:block">
                All Categories
              </span>
            </div>
            <ChevronDown color="white" />
          </div>

          {/* Dropdown Menu */}
          {show && (
            <div
              className={`absolute top-[55px] w-[260px] h-[400px] bg-[#b4b367] z-50`}
            />
          )}

          {/* Nav Links */}
          <div className="flex-1 flex justify-center gap-6 overflow-x-auto scrollbar-hide">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="text-white font-medium text-md md:text-lg whitespace-nowrap"
              >
                {item.title}
              </Link>
            ))}
          </div>

          {/* Login + Cart/Wishlist (visible only when sticky) */}
          {isSticky && (
            <div className="flex items-center gap-6">
              {/* Login Info */}
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <ProfileIcon />
                </Link>
                <Link href="/login" className="text-white font-medium text-lg">
                  {!isLoading && user
                    ? `Hello, ${user?.name?.split(' ')[0]}`
                    : 'Hello, Sign in'}
                </Link>
              </div>

              {/* Wishlist & Cart */}
              <div className="flex items-center gap-5">
                <Link href="/wishlist" className="relative hidden md:block">
                  <HeartIconOutline size={24} stroke="white" />
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center absolute right-[-6px] top-[-4px]">
                    <span className="text-white text-sm">
                      {wishlist?.length}
                    </span>
                  </div>
                </Link>
                <Link href="/cart" className="relative">
                  <CartIconOutline size={24} stroke="white" />
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center absolute right-[-6px] top-[-4px]">
                    <span className="text-white text-sm">{cart?.length}</span>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderBottom;
