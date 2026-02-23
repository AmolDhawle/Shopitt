'use client';

import { AlignLeft, ChevronDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { navItems } from '../../configs/constants';
import Link from 'next/link';
import useUser from '../../hooks/useUser';
import ProfileIcon from '../../assets/svgs/profile-icon';

const HeaderBottom = () => {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const { user, isLoading } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`w-full bg-[#49a6e4] transition-all duration-300  ${
        isSticky ? 'fixed top-0 left-0 z-[100] shadow-lg' : 'relative'
      }`}
    >
      <div
        className={`max-w-7xl mx-auto px-4 flex items-center justify-between relative ${
          isSticky ? 'pt-3' : 'py-0'
        }`}
      >
        {/* All Categories */}
        <div
          className={`w-[60px] md:w-[260px] shrink-0 cursor-pointer flex items-center justify-between px-5 h-[50px] bg-[#fcd603]`}
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

        {/* Dropdown */}
        {show && (
          <div
            className={`absolute left-4 ${
              isSticky ? 'top-[70px]' : 'top-[50px]'
            } w-[260px] h-[400px] bg-[#b4b367] z-50`}
          />
        )}

        <div className="m-auto mx-4 flex justify-between overflow-x-auto scrollbar-hide">
          <div className="flex items-center whitespace-nowrap">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="px-4 text-white font-medium text-lg shrink-0"
              >
                {item.title}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-8 pb-2">
            {isSticky && (
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  {!isLoading && user ? (
                    <>
                      <Link href="/login">
                        <ProfileIcon />
                      </Link>
                      <Link href="/login">
                        <span className="block text-lg text-white font-medium cursor-pointer">
                          Hello,
                        </span>
                        <span className="text-lg text-white font-medium cursor-pointer">
                          {isLoading ? '...' : user?.name?.split(' ')[0]}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderBottom;
