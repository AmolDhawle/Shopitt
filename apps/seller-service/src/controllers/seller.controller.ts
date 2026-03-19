import { Request, Response, NextFunction } from 'express';
import { prisma } from '@shopitt/prisma-client';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '@shopitt/error-handler';
import rateLimit from 'express-rate-limit';
import { redis } from '@shopitt/redis';

// Rate limiting middleware for products and follow/unfollow routes
const productRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});

const followRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit to 20 requests per minute per IP
  message: 'Too many follow/unfollow requests, please try again later.',
});

// GET SELLER DETAILS with Redis caching
export const getSellerDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // First, check Redis cache
    const cacheKey = `shop_${id}_details`;
    const cachedShop = await redis.get(cacheKey);

    if (cachedShop) {
      // If data is found in cache, return it
      return res.status(200).json(JSON.parse(cachedShop));
    }

    // Fetch from DB if not cached
    const shop = await prisma.shops.findUnique({
      where: { id },
      include: {
        avatar: true,
        reviews: {
          select: { rating: true },
        },
      },
    });

    if (!shop) throw new NotFoundError('Shop not found');

    const followersCount = await prisma.shopFollowers.count({
      where: { shopId: id },
    });

    const response = {
      success: true,
      shop,
      followersCount,
    };

    // Cache the result in Redis for 5 minutes
    await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);

    return res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
};

// GET SELLER PRODUCTS with Redis caching + Rate limiting
export const getSellerProducts = [
  productRateLimiter, // Apply rate limiting
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shopId } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const skip = (page - 1) * limit;

      // Check Redis cache for products
      const cacheKey = `shop_${shopId}_products_page_${page}_limit_${limit}`;
      const cachedProducts = await redis.get(cacheKey);

      if (cachedProducts) {
        // If cached, return the data
        return res.status(200).json(JSON.parse(cachedProducts));
      }

      // Fetch from DB if not cached
      const products = await prisma.products.findMany({
        where: {
          shopId,
          isDeleted: false,
          isEvent: false,
          status: 'Active',
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: true,
        },
      });

      const total = await prisma.products.count({
        where: {
          shopId,
          isDeleted: false,
          isEvent: false,
          status: 'Active',
        },
      });

      const response = {
        success: true,
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      // Cache the products in Redis for 5 minutes
      await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);

      return res.status(200).json(response);
    } catch (error) {
      return next(error);
    }
  },
];

// GET SELLER EVENTS (OFFERS) with Rate limiting
export const getSellerEvents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { shopId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const skip = (page - 1) * limit;

    const products = await prisma.products.findMany({
      where: {
        shopId,
        isDeleted: false,
        isEvent: true,
        status: 'Active',
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        images: true,
      },
    });

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    return next(error);
  }
};

// FOLLOW SHOP with Rate limiting
export const followShop = [
  followRateLimiter, // Apply rate limiting
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { shopId } = req.body;

      if (!userId) throw new ForbiddenError('Unauthorized');
      if (!shopId) throw new BadRequestError('Shop ID is required');

      // Prevent duplicate follow
      const existing = await prisma.shopFollowers.findUnique({
        where: {
          shopId_userId: {
            shopId,
            userId,
          },
        },
      });

      if (existing) {
        return res.status(200).json({ success: true });
      }

      await prisma.shopFollowers.create({
        data: {
          shopId,
          userId,
        },
      });

      return res.status(201).json({ success: true });
    } catch (error) {
      return next(error);
    }
  },
];

// UNFOLLOW SHOP with Rate limiting
export const unfollowShop = [
  followRateLimiter, // Apply rate limiting
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { shopId } = req.body;

      if (!userId) throw new ForbiddenError('Unauthorized');

      await prisma.shopFollowers.deleteMany({
        where: {
          shopId,
          userId,
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      return next(error);
    }
  },
];

// CHECK FOLLOW STATUS
export const isFollowingShop = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { shopId } = req.params;

    if (!userId) {
      return res.status(200).json({ isFollowing: null });
    }

    const follow = await prisma.shopFollowers.findUnique({
      where: {
        shopId_userId: {
          shopId,
          userId,
        },
      },
    });

    return res.status(200).json({
      isFollowing: !!follow,
    });
  } catch (error) {
    return next(error);
  }
};
