import { Request, Response, NextFunction } from 'express';
import { prisma } from '@shopitt/prisma-client';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

// Get Product Categories
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const config = await prisma.siteConfig.findFirst();

    if (!config) {
      return res.status(404).json({ message: 'Categories not found' });
    }

    return res.status(200).json({
      categories: config.categories,
      subCategories: config.subCategories,
    });
  } catch (error) {
    return next(error);
  }
};

// Create discount code
export const createDiscountCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sellerId = req.seller?.id;

    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      publicName,
      discountType,
      discountValue,
      discountCode,
      expiresAt,
      usageLimit,
      minimumOrderAmount,
      maximumDiscountAmount,
      applicableProducts,
      applicableCategories,
    } = req.body;

    // Basic validation
    if (!publicName || !discountType || !discountValue || !discountCode) {
      return res.status(400).json({
        message: 'Required fields are missing',
      });
    }

    // Normalize discount code (important)
    const normalizedCode = discountCode.trim().toUpperCase();

    // Validate enum
    if (!Object.values(DiscountType).includes(discountType)) {
      return res.status(400).json({
        message: 'Invalid discount type',
      });
    }

    const productsArray = applicableProducts
      ? applicableProducts.split(',').map((p: string) => p.trim())
      : [];
    const categoriesArray = applicableCategories
      ? applicableCategories.split(',').map((c: string) => c.trim())
      : [];

    // Business rule: percentage must be <= 100
    if (discountType === 'PERCENTAGE' && Number(discountValue) > 100) {
      return res.status(400).json({
        message: 'Percentage discount cannot exceed 100%',
      });
    }

    // Check duplicate for same seller
    const existingCode = await prisma.discountCode.findUnique({
      where: {
        discountCode_sellerId: {
          discountCode: normalizedCode,
          sellerId,
        },
      },
    });

    if (existingCode) {
      return res.status(409).json({
        message: 'Discount code already exists for this seller',
      });
    }

    // Create discount code
    const discount = await prisma.discountCode.create({
      data: {
        publicName,
        discountType,
        discountValue,
        discountCode: normalizedCode,
        sellerId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        usageLimit,
        minimumOrderAmount,
        maximumDiscountAmount,
        applicableProducts: productsArray,
        applicableCategories: categoriesArray,
      },
    });

    return res.status(201).json({
      message: 'Discount code created successfully',
      discount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// Get Discount Codes
export const getDiscountCodes = async (req: Request, res: Response) => {
  try {
    const sellerId = req.seller?.id;

    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { page = '1', limit = '10', isActive, search } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const whereClause: any = {
      sellerId,
    };

    // Filter by active status
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    } else {
      whereClause.isActive = true;
    }

    // Search by discount code or public name
    if (search) {
      whereClause.OR = [
        {
          discountCode: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
        {
          publicName: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [discounts, total] = await Promise.all([
      prisma.discountCode.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber,
      }),
      prisma.discountCode.count({
        where: whereClause,
      }),
    ]);

    return res.status(200).json({
      success: true,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      total,
      discounts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// Delete discount code
export const deleteDiscountCode = async (req: Request, res: Response) => {
  try {
    const sellerId = req.seller?.id;
    const { id } = req.params;

    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Discount ID is required' });
    }

    const discountCode = await prisma.discountCode.findFirst({
      where: {
        id,
        sellerId,
      },
    });

    if (!discountCode) {
      return res.status(404).json({
        message: 'Discount not found',
      });
    }

    await prisma.discountCode.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Discount code deactivated successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};
