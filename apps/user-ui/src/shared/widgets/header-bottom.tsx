// 'use client';

// import { AlignLeft, ChevronDown } from 'lucide-react';
// import React, { useEffect, useState } from 'react';
// import { navItems } from '../../configs/constants';
// import Link from 'next/link';
// import ProfileIcon from '../../assets/svgs/profile-icon';
// import { HeartIconOutline } from '../../assets/svgs/heart-icon';
// import { CartIconOutline } from '../../assets/svgs/shopping-cart-icon';

// const HeaderBottom = () => {
//   const [show, setShow] = useState(false);
//   const [isSticky, setIsSticky] = useState(false);

//   useEffect(() => {
//     const handleScroll = () => {
//       if (window.scrollY > 100) {
//         setIsSticky(true);
//       } else {
//         setIsSticky(false);
//       }
//     };

//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);
//   return (
//     <div
//       className={`w-full transition-all duration-300 ${isSticky ? 'fixed top-0 left-0 z-[100] bg-white shadow-lg' : 'relative'}`}
//     >
//       <div
//         className={`w-[80%] relative m-auto flex items-center justify-between ${isSticky ? 'pt-3' : 'py-0'}`}
//       >
//         {/* All Dropdowns */}
//         <div
//           className={`w-[260px] ${isSticky && 'mb-2'} cursor-pointer flex items-center justify-between px-5 h-[50px] bg-[#f3d00c]`}
//           onClick={() => setShow(!show)}
//         >
//           <div className="flex items-center gap-2">
//             <AlignLeft color="white" />
//             <span className="text-white font-medium">All Categories</span>
//           </div>
//           <ChevronDown color="white" />
//         </div>

//         {/* Dropdown Menu */}
//         {show && (
//           <div
//             className={`absolute left-0 ${isSticky ? 'top-[70px]' : 'top-[50px]'} w-[260px] h-[400px] bg-[#f3f2b3]`}
//           >
//             {' '}
//           </div>
//         )}

//         {/* Navigation Links */}
//         <div className="flex items-center">
//           {navItems.map((item: NavItemsTypes, index: number) => (
//             <Link
//               className="px-5 text-white font-medium text-lg"
//               href={item.href}
//               key={index}
//             >
//               {item.title}
//             </Link>
//           ))}
//         </div>
//         <div>
//           {isSticky && (
//             <div className="flex items-center gap-8">
//               <div className="flex items-center gap-2">
//                 <Link
//                   href="/login"
//                   className="border-2 rounded-full w-[50px] h-[50px] flex items-center justify-center relative"
//                 >
//                   <ProfileIcon size={32} fill="#3489FF" />
//                 </Link>
//                 <Link href="/login">
//                   <span className="block text-md font-medium">Hello,</span>
//                   <span className="text-md font-semibold">Sign In</span>
//                 </Link>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Link href="/wishlist" className="relative">
//                   <HeartIconOutline size={32} />
//                 </Link>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Link href="/cart" className="relative">
//                   <CartIconOutline size={32} />
//                 </Link>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default HeaderBottom;

'use client';

import { AlignLeft, ChevronDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { navItems } from '../../configs/constants';
import Link from 'next/link';

const HeaderBottom = () => {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`w-full bg-[#49a6e4] transition-all duration-300 overflow-x-hidden ${
        isSticky ? 'fixed top-0 left-0 z-[100] shadow-lg' : 'relative'
      }`}
    >
      <div
        className={`max-w-7xl mx-auto px-4 flex items-center justify-between ${
          isSticky ? 'pt-3 pb-2' : 'py-0'
        }`}
      >
        {/* All Categories */}
        <div
          className={`w-[60px] md:w-[260px] shrink-0 cursor-pointer flex items-center justify-between px-5 h-[50px] bg-[#f3d00c]`}
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
            } w-[260px] h-[400px] bg-[#f3f2b3] z-50`}
          />
        )}

        <div className="ml-auto mx-4 overflow-x-auto scrollbar-hide">
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
        </div>
      </div>
    </div>
  );
};

export default HeaderBottom;
