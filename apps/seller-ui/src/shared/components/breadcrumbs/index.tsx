import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

type BreadCrumbsProps = {
  title: string;
};

const BreadCrumbs = ({ title }: BreadCrumbsProps) => {
  return (
    <div className="flex items-center mb-4">
      <Link href={'/dashboard'} className="text-blue-400 cursor-pointer">
        Dashboard
      </Link>
      <ChevronRight size={20} className="text-gray-200" />
      <span className="text-white">All Products</span>
    </div>
  );
};

export default BreadCrumbs;
