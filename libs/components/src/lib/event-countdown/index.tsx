'use client';

import { useEffect, useState } from 'react';

const EventCountdown = ({ endDate }: { endDate: string }) => {
  const calculateTimeLeft = () => {
    const diff = new Date(endDate).getTime() - new Date().getTime();

    if (diff <= 0) return null;

    return {
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;

  return (
    <div className="text-xs text-red-500 mt-1">
      Ends in {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </div>
  );
};

export default EventCountdown;
