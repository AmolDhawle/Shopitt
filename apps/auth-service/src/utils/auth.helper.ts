import crypto from 'crypto';
import {
  AuthenticationError,
  BadRequestError,
  RateLimitExceededError,
  ValidationError,
} from '@shopitt/error-handler';
import { redis } from '@shopitt/redis';
import { sendEmailWithOtp } from './sendMailWithOtp';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '@shopitt/prisma-client';

const MAX_ATTEMPTS = 5;
const ATTEMPT_TTL = 60 * 60;
const LOCK_TTL = 60 * 60;
const COOLDOWN_TTL = 60;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate registration data based on user type (user or seller)
export const validateRegistrationData = (
  data: any,
  userType: 'user' | 'seller',
) => {
  const { name, email, password, phone_number, country_code } = data;

  if (
    !name ||
    !email ||
    !password ||
    (userType === 'seller' && (!phone_number || !country_code))
  ) {
    throw new BadRequestError('Missing required fields for registration');
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  if (password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters long');
  }
};

// Check OTP restrictions before sending or verifying OTP requests
export const checkOtpRestrictions = async (
  email: string,
  next: NextFunction,
): Promise<void> => {
  // Check if user is already locked
  if (await redis.get(`otp_lock:${email}`)) {
    return next(
      new RateLimitExceededError(
        `Too many failed OTP attempts. Please try again after ${
          LOCK_TTL / 60
        } minutes.`,
      ),
    );
  }

  // Check failed attempts
  const attempts = Number((await redis.get(`otp_attempts:${email}`)) ?? 0);
  if (attempts >= MAX_ATTEMPTS) {
    await redis.set(`otp_lock:${email}`, '1', 'EX', LOCK_TTL);
    return next(
      new RateLimitExceededError(
        `Too many failed OTP attempts. Please try again after ${
          LOCK_TTL / 60
        } minutes.`,
      ),
    );
  }

  // Check OTP request cooldown
  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(
      new RateLimitExceededError(
        `OTP request limit reached. Please try again after ${COOLDOWN_TTL} seconds.`,
      ),
    );
  }
};

// Track OTP requests to prevent spamming of OTP requests
export const trackOtpRequests = async (email: string, next: NextFunction) => {
  const otpRequestKey = `otp_request_count:${email}`;
  const spamLockKey = `otp_spam_lock:${email}`;
  const MAX_REQUESTS = 5;

  // Check if user is already locked for spamming OTP requests
  const isLocked = await redis.get(spamLockKey);
  if (isLocked) {
    return next(
      new RateLimitExceededError(
        'Too many OTP requests. Please try again after 1 hour.',
      ),
    );
  }

  // Atomically increment the OTP request counter
  const requests = await redis.incr(otpRequestKey);

  // Set TTL if this is the first request in the current window
  if (requests === 1) {
    await redis.expire(otpRequestKey, LOCK_TTL);
  }

  // If user exceeds limit, lock them for spamming OTP requests
  if (requests > MAX_REQUESTS) {
    await redis.set(spamLockKey, '1', 'EX', LOCK_TTL);
    return next(
      new ValidationError(
        'Too many OTP requests. Please try again after 1 hour.',
      ),
    );
  }
};

// Send OTP to user's email and store it in Redis with expiration
export const sendOtp = async (
  name: string,
  email: string,
  template: string,
) => {
  const otp = crypto.randomInt(100000, 999999).toString();
  await sendEmailWithOtp(email, 'Verify Your Email', template, { name, otp });
  await redis.set(`otp:${email}`, otp, 'EX', 5 * 60); // OTP valid for 5 minutes
  await redis.set(`otp_cooldown:${email}`, 1, 'EX', COOLDOWN_TTL); // Cooldown of 60 seconds
  await redis.set(`otp_attempts:${email}`, 0, 'EX', ATTEMPT_TTL); // Attempts counter valid for 30 minutes
};

// Verify the provided OTP against the stored OTP in Redis
export const verifyOtp = async (email: string, otp: string) => {
  const lockKey = `otp_lock:${email}`;
  const otpKey = `otp:${email}`;
  const attemptsKey = `otp_attempts:${email}`;

  // Check if user is locked due to too many failed attempts
  const isLocked = await redis.get(lockKey);
  if (isLocked) {
    throw new RateLimitExceededError(
      'Too many failed OTP attempts. Please try again after 1 hour.',
    );
  }

  // Check OTP existence (expired / invalid)
  const storedOtp = await redis.get(otpKey);
  if (!storedOtp) {
    throw new AuthenticationError('OTP has expired or is invalid');
  }

  // Compare OTP
  if (storedOtp !== otp) {
    const attempts = await redis.incr(attemptsKey);

    // Set TTL only on first failure
    if (attempts === 1) {
      await redis.expire(attemptsKey, ATTEMPT_TTL);
    }

    // Lock user if max attempts reached
    if (attempts >= MAX_ATTEMPTS) {
      await redis.set(lockKey, '1', 'EX', LOCK_TTL);
      await redis.del(attemptsKey);
      throw new RateLimitExceededError(
        'Too many failed OTP attempts. Please try again after 1 hour.',
      );
    }

    throw new AuthenticationError(
      `Invalid OTP. ${MAX_ATTEMPTS - attempts} attempts remaining.`,
    );
  }

  // OTP is valid — cleanup
  await Promise.all([
    redis.del(otpKey),
    redis.del(attemptsKey),
    redis.del(lockKey),
  ]);

  return true;
};

// Handle forgot password request by sending OTP to user's email
export const handleForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new BadRequestError('Email is required'));
    }

    // Try user first
    const user = await prisma.users.findUnique({
      where: { email },
    });

    // Try seller if user not found
    const seller = !user
      ? await prisma.sellers.findUnique({ where: { email } })
      : null;

    const account = user ?? seller;

    // Prevent email enumeration
    if (!account || ('isVerified' in account && !account.isVerified)) {
      return res.status(200).json({
        success: true,
        message: 'If the email exists, an OTP has been sent.',
      });
    }

    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);

    await sendOtp(account.name, email, 'forgot-password-reset-mail');

    return res.status(200).json({
      success: true,
      message: 'If the email exists, an OTP has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

// Mark password reset as verified in Redis
export const markPasswordResetVerified = async (email: string) => {
  await redis.set(`password_reset_verified:${email}`, '1', 'EX', 15 * 60); // 15 minutes validity
};

// Check if password reset is verified
export const isPasswordResetVerified = async (
  email: string,
): Promise<boolean> => {
  const flag = await redis.get(`password_reset_verified:${email}`);
  return flag === '1';
};

// Clear password reset verification state
export const clearPasswordResetState = async (email: string) => {
  await redis.del(`password_reset_verified:${email}`);
};
