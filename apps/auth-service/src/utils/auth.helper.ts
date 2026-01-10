import crypto from "crypto";
import { ValidationError } from "@shopitt/error-handler";
import { redis } from "@shopitt/redis";
import { sendEmailWithOtp } from "./sendMailWithOtp";
import { NextFunction } from "express";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (
  data: any,
  userType: "user" | "seller"
) => {
  const { name, email, password, phone_number, country } = data;

  if (
    !name ||
    !email ||
    !password ||
    (userType === "seller" && (!phone_number || !country))
  ) {
    throw new ValidationError("Missing required fields for registration");
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }

  if (password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters long");
  }
};

export const checkOtpRestrictions = async (
  email: string,
  next: NextFunction
): Promise<void> => {
  const LOCK_TTL = 60 * 60; // 1 hour
  const COOLDOWN_TTL = 60; // 60 seconds
  const MAX_ATTEMPTS = 5;

  // Check if user is already locked
  if (await redis.get(`otp_lock:${email}`)) {
    return next(
      new ValidationError(
        `Too many failed OTP attempts. Please try again after ${
          LOCK_TTL / 60
        } minutes.`
      )
    );
  }

  // Check failed attempts
  const attempts = Number((await redis.get(`otp_attempts:${email}`)) ?? 0);
  if (attempts >= MAX_ATTEMPTS) {
    await redis.set(`otp_lock:${email}`, "1", "EX", LOCK_TTL);
    return next(
      new ValidationError(
        `Too many failed OTP attempts. Please try again after ${
          LOCK_TTL / 60
        } minutes.`
      )
    );
  }

  // Check OTP request cooldown
  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(
      new ValidationError(
        `OTP request limit reached. Please try again after ${COOLDOWN_TTL} seconds.`
      )
    );
  }
};

export const trackOtpRequests = async (email: string, next: NextFunction) => {
  const otpRequestKey = `otp_request_count:${email}`;
  const spamLockKey = `otp_spam_lock:${email}`;
  const MAX_REQUESTS = 5;
  const LOCK_TTL = 60 * 60;

  // Check if user is already locked
  const isLocked = await redis.get(spamLockKey);
  if (isLocked) {
    return next(
      new ValidationError(
        "Too many OTP requests. Please try again after 1 hour."
      )
    );
  }

  // Atomically increment the OTP request counter
  const requests = await redis.incr(otpRequestKey);

  // Set TTL if this is the first request
  if (requests === 1) {
    await redis.expire(otpRequestKey, LOCK_TTL);
  }

  // If user exceeds limit, lock them
  if (requests > MAX_REQUESTS) {
    await redis.set(spamLockKey, "1", "EX", LOCK_TTL);
    return next(
      new ValidationError(
        "Too many OTP requests. Please try again after 1 hour."
      )
    );
  }
};

export const sendOtp = async (
  name: string,
  email: string,
  template: string
) => {
  const otp = crypto.randomInt(100000, 999999).toString();
  await sendEmailWithOtp(email, "Verify Your Email", template, { name, otp });
  await redis.set(`otp:${email}`, otp, "EX", 5 * 60); // OTP valid for 5 minutes
  await redis.set(`otp_cooldown:${email}`, 1, "EX", 60); // Cooldown of 60 seconds
  await redis.set(`otp_attempts:${email}`, 0, "EX", 30 * 60); // Attempts counter valid for 30 minutes

  // Simulate sending OTP via email
  console.log(
    `Sending OTP ${otp} to email ${email} using template ${template}`
  );
};

const MAX_ATTEMPTS = 5;
const ATTEMPT_TTL = 60 * 60;
const LOCK_TTL = 60 * 60;

export const verifyOtp = async (
  email: string,
  otp: string,
  next: NextFunction
) => {
  const lockKey = `otp_lock:${email}`;
  const otpKey = `otp:${email}`;
  const attemptsKey = `otp_attempts:${email}`;

  // Check if user is locked
  const isLocked = await redis.get(lockKey);
  if (isLocked) {
    return next(
      new ValidationError(
        "Too many failed OTP attempts. Please try again after 1 hour."
      )
    );
  }

  // Check OTP existence (expired / invalid)
  const storedOtp = await redis.get(otpKey);
  if (!storedOtp) {
    return next(new ValidationError("OTP has expired or is invalid"));
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
      await redis.set(lockKey, "1", "EX", LOCK_TTL);
      await redis.del(attemptsKey);

      return next(
        new ValidationError(
          "Too many failed OTP attempts. Please try again after 1 hour."
        )
      );
    }

    return next(
      new ValidationError(
        `Invalid OTP. ${MAX_ATTEMPTS - attempts} attempts remaining.`
      )
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
