import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '@shopitt/error-handler';
import { getEnv } from './env';
import { prisma } from '@shopitt/prisma-client';
import { UserContext } from '../types/userContext';
import { AdminContext } from '../types/adminContext';
import { SellerContext } from '../types/sellerContext';

interface JwtPayload {
  subjectId?: string;
  userId?: string;
  sellerId?: string;
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

    if (!token) {
      throw new AuthenticationError('Authentication required');
    }

    const payload = jwt.verify(
      token,
      getEnv('ACCESS_TOKEN_SECRET'),
    ) as JwtPayload;

    // Support multiple token formats
    const accountId = payload.subjectId || payload.userId || payload.sellerId;

    if (!accountId) {
      throw new AuthenticationError('Invalid token payload');
    }

    let account;

    // USER OR ADMIN
    if (payload.role === 'user' || payload.role === 'admin') {
      account = await prisma.users.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new AuthenticationError('User not found');
      }

      req.user = account as unknown as UserContext;

      if (payload.role === 'admin') {
        req.admin = account as unknown as AdminContext;
      }
    }

    // SELLER
    if (payload.role === 'seller') {
      account = await prisma.sellers.findUnique({
        where: { id: accountId },
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

      req.seller = account as unknown as SellerContext;
    }

    req.role = payload.role;

    next();
  } catch (error) {
    console.log('JWT VERIFY ERROR:', error);
    return next(new AuthenticationError('Invalid or expired access token'));
  }
};
