import { NextFunction } from 'express';
import { redis } from '@shopitt/redis';
import { RateLimitExceededError } from '@shopitt/error-handler';

export const checkLoginThrottle = async (
  email: string,
  next: NextFunction,
): Promise<void> => {
  const isLocked = await redis.get(`login_lock:${email}`);

  if (isLocked) {
    return next(
      new RateLimitExceededError(
        'Too many failed login attempts. Try again later.',
      ),
    );
  }
};
