import { Request, Response, NextFunction } from 'express';
import { prisma } from '@shopitt/prisma-client';
import { imagekit } from '@shopitt/imagekit';
import { AuthenticationError, ValidationError } from '@shopitt/error-handler';

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

export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log('Hit controller');
    const { fileName } = req.body;

    const response = await imagekit.upload({
      file: fileName,
      fileName: `product-${Date.now()}.jpg`,
      folder: '/products',
    });

    return res.status(201).json({
      fileId: response.fileId,
      file_url: response.url,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log('DELETE FILE', req.body);
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required',
      });
    }

    await imagekit.deleteFile(fileId);

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE ERROR FULL: ', error);
    console.error('DELETE ERROR MESSAGE', error?.message);
    console.error('DELETE ERROR RESPONSE', error?.response?.data);
    return next(error);
  }
};

// create product
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      title,
      short_description,
      tags,
      warranty,
      slug,
      brand,
      category,
      subcategory,
      regular_price,
      sale_price,
      stock,
      sizes = [],
      colors = [],
      discountCodes,
      images = [],
      video_url,
      custom_specifications,
      custom_properties = {},
      cash_on_delivery,
      detailed_description,
    } = req.body;

    if (
      !title?.trim() ||
      !slug?.trim() ||
      !short_description?.trim() ||
      !brand ||
      !category ||
      !subcategory ||
      regular_price == null ||
      sale_price == null ||
      !tags ||
      stock == null ||
      !Array.isArray(images) ||
      images.length === 0
    ) {
      return next(new ValidationError('Missing required priduct fields'));
    }

    if (!req.seller?.id) {
      return next(new AuthenticationError('Only seller can create products'));
    }

    const slugChecking = await prisma.products.findUnique({
      where: {
        slug,
      },
    });

    if (slugChecking) {
      return next(
        new ValidationError('Slug already exist! Please use a different slug!'),
      );
    }

    const newProduct = await prisma.products.create({
      data: {
        title,
        shortDescription: short_description,
        detailedDescription: detailed_description,
        warranty,
        cashOnDelivery: cash_on_delivery,
        slug,
        shopId: req.seller?.shop?.id!,
        tags: Array.isArray(tags) ? tags : tags.split(','),
        brand,
        videoUrl: video_url,
        category,
        subcategory,
        colors: colors || [],
        discountCodes: discountCodes?.map((codeId: string) => codeId),
        sizes: sizes || [],
        stock: parseInt(stock),
        salePrice: parseInt(sale_price),
        regularPrice: parseInt(regular_price),
        customProperties: custom_properties || {},
        customSpecifications: custom_specifications || {},
        images: {
          create: images
            .filter((image) => image && image.fileId && image.file_url)
            .map((image: any) => ({
              file_id: image.fileId,
              url: image.file_url,
            })),
        },
      },
      include: { images: true },
    });

    return res.status(201).json({
      success: true,
      newProduct,
    });
  } catch (error) {
    return next(error);
  }
};
