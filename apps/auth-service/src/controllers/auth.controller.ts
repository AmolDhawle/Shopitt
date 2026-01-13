import { NextFunction, Request, Response } from 'express';
import {
  checkOtpRestrictions,
  clearPasswordResetState,
  handleForgotPassword,
  isPasswordResetVerified,
  markPasswordResetVerified,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyOtp,
} from '../utils/auth.helper';
import { AuthenticationError, ValidationError } from '@shopitt/error-handler';
import { prisma } from '@shopitt/prisma-client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { setCookie } from '../utils/cookies/setCookie';
import { checkLoginThrottle } from '../middlewares/loginThrottle';

// Hash the refresh token before storing
const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

// Register a new user
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    validateRegistrationData(req.body, 'user');
    const { name, email } = req.body;

    // Check if user already exists and is verified
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser && existingUser.isVerified) {
      return next(new ValidationError('Email already in use'));
    }

    // OTP restriction and request tracking
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);

    // If user exists but unverified, update info or resend OTP
    if (!existingUser) {
      await prisma.users.create({
        data: { name, email, password: null, isVerified: false },
      });
    }

    await sendOtp(name, email, 'user-activation-mail');

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully. Please verify your account.',
    });
  } catch (error) {
    return next(error);
  }
};

// Verifiy user with OTP
export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp, password, name } = req.body;

    if (!email || !otp || !password || !name) {
      return next(new ValidationError('Missing required fields'));
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (!existingUser) {
      return next(
        new ValidationError('User not found. Please register first.'),
      );
    }

    if (existingUser.isVerified) {
      return next(new ValidationError('User already verified, Please login'));
    }

    await verifyOtp(email, otp);

    const hashedPassword = await bcrypt.hash(password, 10);

    // Activate user
    await prisma.users.update({
      where: { email },
      data: {
        password: hashedPassword,
        isVerified: true,
      },
    });

    return res
      .status(201)
      .json({ success: true, message: 'User registered successfully.' });
  } catch (error) {
    return next(error);
  }
};

// Login user
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError('Missing required fields'));
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (!existingUser || !existingUser.isVerified) {
      return next(new AuthenticationError('Invalid email or password'));
    }
    // Check login throttle
    await checkLoginThrottle(email, next);

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password!,
    );

    if (!isPasswordValid) {
      return next(new AuthenticationError('Invalid email or password'));
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: existingUser.id, role: 'user' },
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: '15m',
      },
    );

    const refreshToken = jwt.sign(
      { userId: existingUser.id },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' },
    );

    await prisma.refreshToken.create({
      data: {
        userId: existingUser.id,
        token: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // store the referesh token and access token in httpOnly cookies
    setCookie(res, 'accessToken', accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    setCookie(res, 'refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Refresh JWT tokens to keep user logged in
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return next(new AuthenticationError('Unauthorized'));
    }

    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as {
      userId: string;
    };

    const hashed = hashToken(token);

    const storedToken = await prisma.refreshToken.findFirst({
      where: { token: hashed, userId: payload.userId },
    });

    if (!storedToken) {
      return next(new AuthenticationError('Invalid refresh token'));
    }

    // Rotate token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const newAccessToken = jwt.sign(
      { userId: payload.userId },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' },
    );

    const newRefreshToken = jwt.sign(
      { userId: payload.userId },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' },
    );

    await prisma.refreshToken.create({
      data: {
        userId: payload.userId,
        token: hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setCookie(res, 'accessToken', newAccessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });

    setCookie(res, 'refreshToken', newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  } catch (error) {
    return next(new AuthenticationError('Invalid refresh token'));
  }
};

// Logout user and invalidate tokens
export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({
        where: { token: hashToken(token) },
      });
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    return next(error);
  }
};

// Handle user forgot password request
export const userForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await handleForgotPassword(req, res, next);
};

export const verifyUserForPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new ValidationError('Email and OTP are required'));
    }

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user || !user.isVerified) {
      return next(new ValidationError('Invalid OTP'));
    }

    await verifyOtp(email, otp);

    // Mark reset permission (Redis / DB)
    await markPasswordResetVerified(email);

    return res.status(200).json({
      success: true,
      message: 'OTP verified. You may reset your password.',
    });
  } catch (error) {
    next(error);
  }
};

// Reset user password after OTP verification
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return next(new ValidationError('Missing required fields'));
    }

    const isAllowed = await isPasswordResetVerified(email);
    if (!isAllowed) {
      throw new ValidationError(
        'OTP verification required before resetting password',
      );
    }

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user || !user.password) {
      throw new ValidationError('Invalid request');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      throw new ValidationError(
        'New password must be different from old password',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.users.update({
        where: { email },
        data: { password: hashedPassword },
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    await clearPasswordResetState(email);

    return res
      .status(200)
      .json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    return next(error);
  }
};
