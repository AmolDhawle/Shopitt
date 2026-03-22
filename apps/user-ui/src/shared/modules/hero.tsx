import useLayout from '@user-ui/hooks/useLayout';
import { MoveRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const Hero = () => {
  const router = useRouter();
  const { layout } = useLayout();

  return (
    <div className="relative w-full h-[90vh] bg-gradient-to-r from-[#115061] to-[#33a1c9]">
      <div className="absolute inset-0  opacity-30"></div>
      <div className="flex flex-col md:flex-row items-center justify-center w-full h-full px-6 md:px-16">
        {/* Text Content */}
        <div className="md:w-1/2 text-center md:text-left space-y-6">
          <p className="font-roboto text-lg text-white tracking-wide uppercase">
            Starting from ₹1099
          </p>
          <h1 className="text-4xl md:text-6xl text-white font-extrabold leading-tight">
            The Best Watch <br /> Collection 2026
          </h1>
          <p className="font-Oregano text-2xl text-white pt-4">
            Exclusive Offer <span className="text-yellow-400">10%</span> off
            this week
          </p>
          <button
            onClick={() => router.push('/products')}
            className="w-[180px] py-3 px-6 text-lg font-semibold text-[#115061] bg-white rounded-md shadow-md hover:bg-[#f7f7f7] transition duration-300 flex items-center justify-center mt-6 transform hover:scale-105"
          >
            Shop Now <MoveRight className="ml-2" />
          </button>
        </div>

        {/* Product Image */}
        <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
          <div className="relative w-[350px] h-[350px] md:w-[500px] md:h-[500px] transform hover:scale-105 transition duration-500 ease-in-out">
            <Image
              src={
                layout?.banner ||
                'https://ik.imagekit.io/5frbx53sr/products/watch-6.avif'
              }
              alt="Product Image"
              layout="fill"
              objectFit="cover"
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
