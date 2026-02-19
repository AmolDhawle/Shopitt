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
import {
  AuthenticationError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@shopitt/error-handler';
import { prisma } from '@shopitt/prisma-client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { setCookie } from '../utils/cookies/setCookie';
import { checkLoginThrottle } from '../middlewares/loginThrottle';
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

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
      return next(new BadRequestError('Email already in use'));
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

    // Validate input fields
    if (!email || !otp || !password || !name) {
      throw new BadRequestError('Missing required fields');
    }

    // Find the user in the database
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found. Please register first.');
    }

    if (existingUser.isVerified) {
      throw new ForbiddenError('User already verified. Please login.');
    }

    // Verify OTP
    await verifyOtp(email, otp);

    // Hash password and update user data
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.update({
      where: { email },
      data: {
        password: hashedPassword,
        isVerified: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'User verified successfully.',
    });
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
      { subjectId: existingUser.id, role: 'user' },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' },
    );

    const refreshToken = jwt.sign(
      { subjectId: existingUser.id, role: 'user' },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' },
    );

    await prisma.refreshToken.create({
      data: {
        subjectId: existingUser.id,
        subjectType: 'USER',
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
      throw new AuthenticationError('Unauthorized');
    }

    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as {
      subjectId: string;
      role: 'user' | 'seller';
    };

    const subjectType = payload.role === 'user' ? 'USER' : 'SELLER';

    const hashed = hashToken(token);

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: hashed,
        subjectId: payload.subjectId,
        subjectType,
      },
    });

    if (!storedToken) {
      throw new AuthenticationError('Invalid refresh token');
    }

    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    const newAccessToken = jwt.sign(
      {
        role: payload.role,
        ...(payload.role === 'user'
          ? { userId: payload.subjectId }
          : { sellerId: payload.subjectId }),
      },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' },
    );

    const newRefreshToken = jwt.sign(
      {
        subjectId: payload.subjectId,
        role: payload.role,
      },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' },
    );

    await prisma.refreshToken.create({
      data: {
        subjectId: payload.subjectId,
        subjectType,
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

    req.role = payload.role;
    return res.json({ success: true });
  } catch (err) {
    return next(new AuthenticationError('Invalid refresh token'));
  }
};

// Get current authenticated user
export const getMe = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
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
      return next(new BadRequestError('Email and OTP are required'));
    }

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user || !user.isVerified) {
      return next(new AuthenticationError('Invalid OTP'));
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
      return next(new BadRequestError('Missing required fields'));
    }

    const isAllowed = await isPasswordResetVerified(email);
    if (!isAllowed) {
      throw new AuthenticationError(
        'OTP verification required before resetting password',
      );
    }

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user || !user.password) {
      throw new NotFoundError('Invalid request');
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
        where: { subjectId: user.id, subjectType: 'USER' },
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

export const registerSeller = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password, name, phone_number, country_code } = req.body;

    // Validate input
    if (!email || !password || !name || !phone_number || !country_code) {
      throw new BadRequestError('Missing required fields for seller');
    }

    // Check if seller already exists
    const existingSeller = await prisma.sellers.findUnique({
      where: { email },
    });
    if (existingSeller && existingSeller.isVerified) {
      throw new BadRequestError('Seller already exists with this email!');
    }

    // If user exists but unverified, update info or resend OTP
    if (existingSeller && !existingSeller.isVerified) {
      // Seller exists but not verified → update info if needed
      await prisma.sellers.update({
        where: { email },
        data: {
          name,
          phone_number,
          country_code,
        },
      });
    }

    if (!existingSeller) {
      // Seller does not exist → create new
      await prisma.sellers.create({
        data: {
          name,
          email,
          password: null, // password is set on OTP verification
          country_code,
          phone_number,
          isVerified: false,
        },
      });
    }

    // OTP restrictions and tracking
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);

    // Send OTP for seller activation
    await sendOtp(name, email, 'seller-activation-mail');

    const seller = await prisma.sellers.findUnique({
      where: { email },
    });

    if (seller && seller.isVerified) {
      // Generate the JWT token
      const accessToken = jwt.sign(
        { sellerId: seller.id, role: 'seller' },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: '1h' },
      );

      // Set access token in HTTP-only cookie
      setCookie(res, 'accessToken', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully. Please verify your account.',
    });
  } catch (error) {
    return next(error);
  }
};

// Verify Seller with OTP
export const verifySeller = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp, password } = req.body;

    // Validate input
    if (!email || !otp || !password) {
      throw new BadRequestError('Email, OTP, and password are required');
    }

    // Find the seller
    const seller = await prisma.sellers.findUnique({
      where: { email },
    });

    if (!seller) {
      throw new NotFoundError('Seller not found. Please register first.');
    }

    if (seller.isVerified) {
      throw new ForbiddenError('Seller is already verified. Please login.');
    }

    // Verify OTP
    await verifyOtp(email, otp);

    // Hash password and mark seller as verified
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.sellers.update({
      where: { email },
      data: {
        password: hashedPassword,
        isVerified: true,
      },
    });

    // After OTP is verified, generate access token and set it in cookies
    const accessToken = jwt.sign(
      { sellerId: seller.id, role: 'seller' },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '1h' },
    );

    // Set access token in HTTP-only cookie
    setCookie(res, 'accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Seller verified successfully. You can now create a shop.',
      seller: {
        id: seller.id,
        name: seller.name,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const loginSeller = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError('Missing required fields'));
    }

    const existingSeller = await prisma.sellers.findUnique({
      where: { email },
      include: { shop: true },
    });

    if (!existingSeller || !existingSeller.isVerified) {
      return next(new AuthenticationError('Invalid email or password'));
    }

    // Check login throttle (same protection as users)
    await checkLoginThrottle(email, next);

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      existingSeller.password!,
    );

    if (!isPasswordValid) {
      return next(new AuthenticationError('Invalid email or password'));
    }

    // enforce seller to create shop before logging in
    if (!existingSeller.shopId) {
      return next(
        new ForbiddenError('Please complete shop setup before logging in'),
      );
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { subjectId: existingSeller.id, role: 'seller' },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' },
    );

    const refreshToken = jwt.sign(
      { subjectId: existingSeller.id, role: 'seller' },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' },
    );

    await prisma.refreshToken.create({
      data: {
        subjectId: existingSeller.id,
        subjectType: 'SELLER',
        token: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Store tokens in httpOnly cookies
    setCookie(res, 'accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
    });

    setCookie(res, 'refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    req.seller = {
      id: existingSeller.id,
      email: existingSeller.email,
      name: existingSeller.name,
      phone_number: existingSeller.phone_number,
      country_code: existingSeller.country_code,
      stripeId: existingSeller.stripeId,
      shop: existingSeller.shop,
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      seller: {
        id: existingSeller.id,
        name: existingSeller.name,
        email: existingSeller.email,
        shopId: existingSeller.shopId ?? null,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Get current authenticated user
export const getSeller = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.seller) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    return res.status(200).json({
      success: true,
      seller: req.seller,
    });
  } catch (error) {
    return next(error);
  }
};

// Create shop controller
export const createShop = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      name,
      bio,
      category,
      address,
      opening_hours,
      website,
      socialLinks,
      sellerId,
    } = req.body;

    if (!sellerId) {
      throw new ForbiddenError('Unauthorized');
    }

    // Basic validation
    if (!name || !opening_hours || !category || !address) {
      throw new BadRequestError('Missing required fields');
    }

    // Fetch seller
    const seller = await prisma.sellers.findUnique({
      where: { id: sellerId },
      include: { shop: true },
    });

    if (!seller) {
      throw new BadRequestError('Seller not found');
    }

    if (!seller.isVerified) {
      throw new ForbiddenError('Seller must be verified to create a shop');
    }

    // Enforce one shop per seller
    if (seller.shop) {
      throw new BadRequestError('Seller already has a shop');
    }

    // Create shop
    const shop = await prisma.shops.create({
      data: {
        name,
        bio,
        category,
        address,
        opening_hours,
        website,
        socialLinks: socialLinks ?? [],
        sellerId,
      },
    });

    await prisma.sellers.update({
      where: { id: req.seller!.id },
      data: { shopId: shop.id },
    });

    return res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      data: shop,
    });
  } catch (error) {
    return next(error);
  }
};

// create stripe connect account link
export const createStripeConnection = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const seller = req.seller;

    if (!seller) {
      return next(new BadRequestError('Unauthorized'));
    }

    let stripeAccountId = seller.stripeId;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: seller?.email,
        country: 'GB',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;

      await prisma.sellers.update({
        where: { id: seller.id },
        data: { stripeId: stripeAccountId },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `http://localhost:3000/success`,
      return_url: `http://localhost:3000/success`,
      type: 'account_onboarding',
    });

    res.json({ success: true, url: accountLink.url });
  } catch (error) {
    return next(error);
  }
};
