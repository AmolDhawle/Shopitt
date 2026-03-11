import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '@shopitt/error-handler';
import { getEnv } from './env.js';
import { prisma } from '@shopitt/prisma-client';

interface JwtPayload {
  sellerId?: string;
  userId?: string;
  adminId?: string;
  role: 'user' | 'seller' | 'admin';
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token =
      req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

    // Token must exist
    if (!token) {
      throw new AuthenticationError('Authentication required');
    }

    // Verify token
    const payload = jwt.verify(
      token,
      getEnv('ACCESS_TOKEN_SECRET'),
    ) as JwtPayload;

    if (payload.role === 'seller' && !payload.sellerId) {
      throw new AuthenticationError('Invalid seller token');
    }

    if (payload.role === 'user' && !payload.userId) {
      throw new AuthenticationError('Invalid user token');
    }

    if (payload.role === 'admin' && !payload.adminId) {
      throw new AuthenticationError('Invalid admin token');
    }

    // Fetch account details based on role
    let account;
    if (payload.role === 'user') {
      account = await prisma.users.findUnique({
        where: { id: payload.userId },
      });
      if (!account) {
        throw new AuthenticationError('User not found');
      }
      req.user = account; // Attach user info
    } else if (payload.role === 'seller') {
      account = await prisma.sellers.findUnique({
        where: { id: payload.sellerId },
        include: {
          shop: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });
      if (!account) {
        throw new AuthenticationError('Seller not found');
      }
      req.seller = account; // Attach seller info
    } else if (payload.role === 'admin') {
      account = await prisma.users.findUnique({
        where: { id: payload.userId },
      });

      if (!account) throw new AuthenticationError('Admin not found');

      req.admin = account;
    }

    // Store the role in req.role
    req.role = payload.role;

    next();
  } catch (error) {
    // Token expired or invalid
    console.log('jwt-VERIFY-ERROR', error);
    return next(new AuthenticationError('Invalid or expired access token'));
  }
};
