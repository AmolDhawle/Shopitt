'use client';
import { usePathname } from 'next/navigation';
import React from 'react';

const Footer = () => {
  const pathname = usePathname();
  if (pathname === '/inbox') return null;
  return (
    <footer className="bg-black text-gray-400 pt-16">
      {/* Trust Badges */}
      <div className="border-b border-gray-800 pb-8 mb-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-sm">
          <div>🔒 Secure Payments</div>
          <div>↩️ Easy Returns</div>
          <div>🏪 Verified Sellers</div>
          <div>📞 24/7 Support</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-6 gap-10 text-sm">
        <div>
          <h3 className="text-white mb-4 font-semibold">Company</h3>
          <ul className="space-y-2">
            <li>About</li>
            <li>Careers</li>
            <li>Press</li>
            <li>Blog</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white mb-4 font-semibold">Customers</h3>
          <ul className="space-y-2">
            <li>Help Center</li>
            <li>Track Order</li>
            <li>Returns</li>
            <li>Shipping Policy</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white mb-4 font-semibold">Sellers</h3>
          <ul className="space-y-2">
            <li>Sell on Shopitt</li>
            <li>Seller Dashboard</li>
            <li>Commission</li>
            <li>Seller Policies</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white mb-4 font-semibold">Categories</h3>
          <ul className="space-y-2">
            <li>Fashion</li>
            <li>Electronics</li>
            <li>Home</li>
            <li>Beauty</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white mb-4 font-semibold">Legal</h3>
          <ul className="space-y-2">
            <li>Terms</li>
            <li>Privacy</li>
            <li>Refund Policy</li>
            <li>Cookies</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white mb-4 font-semibold">Stay Updated</h3>
          <div className="flex">
            <input
              type="email"
              placeholder="Your email"
              className="px-3 py-2 text-black w-full rounded-l-md outline-none"
            />
            <button className="bg-blue-600 px-4 py-2 rounded-r-md">Join</button>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800 mt-12 py-6 text-center text-sm">
        © {new Date().getFullYear()} Shopitt. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
