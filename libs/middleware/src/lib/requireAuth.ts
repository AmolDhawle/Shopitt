import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthenticationError } from '@shopitt/error-handler';
import { getEnv } from './env.js';
import { prisma } from '@shopitt/prisma-client';

interface JwtPayload {
  userId: string;
  role: 'user' | 'seller';
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

    if (!payload?.userId) {
      throw new AuthenticationError('Invalid access token');
    }

    const account = await prisma.users.findUnique({
      where: { id: payload.userId },
    });

    // Attach user info to request
    req.user = account;

    next();
  } catch (error) {
    // Token expired or invalid
    return next(new AuthenticationError('Invalid or expired access token'));
  }
};
