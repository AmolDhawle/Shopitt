'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    //refetch seller profile to confirm status
    // await fetch('/api/me')

    const timer = setTimeout(() => {
      router.push('/'); // seller dashboard
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-green-600">
        🎉 Onboarding Successful
      </h1>
      <p className="mt-4 text-gray-600">
        Your payment account is ready. Redirecting to dashboard…
      </p>
    </div>
  );
}
