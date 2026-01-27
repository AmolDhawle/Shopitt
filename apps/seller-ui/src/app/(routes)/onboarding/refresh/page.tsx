'use client';

export default function OnboardingRefreshPage() {
  const retryStripe = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URI}/api/payment/onboard`,
      {
        method: 'POST',
        credentials: 'include',
      }
    );

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold">
        Payment setup not finished
      </h1>
      <p className="text-gray-600 mt-2">
        Please continue onboarding to receive payouts.
      </p>

      <button
        onClick={retryStripe}
        className="mt-6 px-6 py-2 rounded bg-black text-white"
      >
        Continue Setup
      </button>
    </div>
  );
}