import { Request, Response, NextFunction } from 'express';
import { prisma } from '@shopitt/prisma-client';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '@shopitt/error-handler';

// GET SELLER DETAILS
export const getSellerDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

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

    return res.status(200).json({
      success: true,
      shop,
      followersCount,
    });
  } catch (error) {
    return next(error);
  }
};

// GET SELLER PRODUCTS
export const getSellerProducts = async (
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

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// GET SELLER EVENTS (OFFERS)
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

// FOLLOW SHOP
export const followShop = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
};

// UNFOLLOW SHOP
export const unfollowShop = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
};

//CHECK FOLLOW STATUS
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
