'use client';

import { loadStripe, Appearance } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { XCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import CheckoutForm from 'apps/user-ui/src/shared/components/checkout/checkoutForm';
import { Address, User } from 'apps/user-ui/src/types';

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

const CheckoutContent = () => {
  const [clientSecret, setClientSecret] = useState('');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [coupon, setCoupon] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [address, setAddress] = useState<Address | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    const fetchSessionAndClientSecret = async () => {
      if (!sessionId) {
        setError('Invalid session. Please try again.');
        setLoading(false);
        return;
      }

      try {
        const verifyRes = await axiosInstance.get(
          `/order/api/verifying-payment-session?sessionId=${sessionId}`,
        );

        const { session, user, address } = verifyRes.data;
        const { pricing, sellers, cart, coupon } = session;

        setUser(user);
        setAddress(address);
        const totalAmount = pricing.totalAmount;
        if (
          !sellers ||
          sellers.length === 0 ||
          totalAmount === undefined ||
          totalAmount === null
        ) {
          throw new Error('Invalid payment session data.');
        }

        setCartItems(cart);
        setCoupon(coupon);

        const shopId = sellers[0].shopId;
        const stripeAccountId = sellers[0].stripeAccountId;

        if (!shopId) {
          throw new Error('Shop not found in payment session');
        }

        const intentRes = await axiosInstance.post(
          '/order/api/create-payment-intent',
          {
            sessionId,
            shopId,
            stripeAccountId,
          },
        );

        setClientSecret(intentRes.data.clientSecret);
      } catch (err: any) {
        console.error(err);
        setError('Something went wrong while preparing your payment.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndClientSecret();
  }, [sessionId]);

  const appearance: Appearance = {
    theme: 'stripe',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full w-12 h-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] px-4">
        <div className="w-full text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="text-red-500 w-10 h-10" />
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Payment Failed
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            {error} <br className="hidden sm:block" /> Please go back and try
            checking out again.
          </p>

          <button
            onClick={() => router.push('/cart')}
            className="bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-500"
          >
            Back to cart
          </button>
        </div>
      </div>
    );
  }
  return (
    clientSecret && (
      <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
        <CheckoutForm
          clientSecret={clientSecret}
          cartItems={cartItems}
          coupon={coupon}
          sessionId={sessionId}
          user={user}
          address={address}
        />
      </Elements>
    )
  );
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[70vh]">
          <div className="animate-spin rounded-full w-12 h-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
