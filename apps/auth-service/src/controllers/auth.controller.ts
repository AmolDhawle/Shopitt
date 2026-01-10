import { NextFunction, Request, Response } from "express";
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyOtp,
} from "../utils/auth.helper";
import { ValidationError } from "@shopitt/error-handler";
import { prisma } from "@shopitt/prisma-client";
import bcrypt from "bcryptjs";

// Register a new user
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, "user");
    const { name, email } = req.body;

    // Check if user already exists and is verified
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser && existingUser.isVerified) {
      return next(new ValidationError("Email already in use"));
    }

    // OTP restriction and request tracking
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);

    // If user exists but unverified, update info or resend OTP
    if (!existingUser) {
      await prisma.users.create({
        data: { name, email, password: req.body.password, isVerified: false },
      });
    }

    await sendOtp(name, email, "user-activation-mail");

    return res
      .status(200)
      .json({
        success: true,
        message: "OTP sent successfully. Please verify your account.",
      });
  } catch (error) {
    return next(error);
  }
};

// Verifiy user with OTP
export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = req.body;

    if (!email || !otp || !password || !name) {
      return next(new ValidationError("Missing required fields"));
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser && existingUser.isVerified) {
      return next(new ValidationError("User already verified, Please login"));
    }

    await verifyOtp(email, otp, next);

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!existingUser) {
      await prisma.users.create({
        data: { name, email, password: hashedPassword, isVerified: true },
      });
    } else {
      await prisma.users.update({
        where: { email },
        data: { password: hashedPassword, isVerified: true },
      });
    }

    return res
      .status(201)
      .json({ success: true, message: "User registered successfully." });
  } catch (error) {
    return next(error);
  }
};
