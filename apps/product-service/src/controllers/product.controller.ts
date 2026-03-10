import { Request, Response, NextFunction } from 'express';
import { prisma } from '@shopitt/prisma-client';
import { imagekit } from '@shopitt/imagekit';
import { AuthenticationError, ValidationError } from '@shopitt/error-handler';
import { Prisma } from '@shopitt/prisma-client';

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
        discountCode_shopId: {
          discountCode: normalizedCode,
          shopId: req.seller?.shop?.id!,
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
        shopId: req.seller?.shop?.id,
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
    const shopId = req.seller?.shop?.id;

    if (!shopId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { page = '1', limit = '10', isActive, search } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const whereClause: any = {
      shopId,
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
        shopId: req.seller?.shop?.id!,
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
    if (!req.seller?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { fileName } = req.body;

    const response = await imagekit.upload({
      file: fileName,
      fileName: `product-${Date.now()}`,
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
      isEvent = false,
      startingDate,
      endingDate,
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

    if (isEvent) {
      if (!startingDate || !endingDate) {
        return next(new ValidationError('Event must have start and end date'));
      }

      if (new Date(startingDate) >= new Date(endingDate)) {
        return next(new ValidationError('End date must be after start date'));
      }
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
        isEvent,
        startingDate: isEvent ? new Date(startingDate) : null,
        endingDate: isEvent ? new Date(endingDate) : null,
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

// get shop products for the seller
export const getShopProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await prisma.products.findMany({
      where: {
        shopId: req?.seller?.shop?.id,
      },
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

// delete product
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;
    const shopId = req?.seller?.shop?.id;

    const product = await prisma.products.findUnique({
      where: {
        id: productId,
      },
      select: { id: true, shopId: true, isDeleted: true },
    });

    if (!product) {
      return next(new ValidationError('Product not found'));
    }

    if (product.shopId !== shopId) {
      return next(new ValidationError('Unauthorized action'));
    }

    if (product.isDeleted) {
      return next(new ValidationError('Product is already deleted'));
    }

    const deletedProduct = await prisma.products.update({
      where: { id: productId },
      data: {
        isDeleted: true,
        deletedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return res.status(200).json({
      message:
        'Product is scheduled for deletion in 24 hours. You can restore it within this time',
      deletedAt: deletedProduct.deletedAt,
    });
  } catch (error) {
    return next(error);
  }
};

// restore product
export const restoreProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;
    const shopId = req?.seller?.shop?.id;

    // Fetch the product to check if it exists and is deleted
    const product = await prisma.products.findUnique({
      where: {
        id: productId,
      },
      select: { id: true, shopId: true, isDeleted: true, deletedAt: true },
    });

    // If product not found
    if (!product) {
      return next(new ValidationError('Product not found'));
    }

    // Check if the seller has access to this product
    if (product.shopId !== shopId) {
      return next(new ValidationError('Unauthorized action'));
    }

    // If product is not deleted, no need to restore
    if (!product.isDeleted) {
      return next(new ValidationError('Product is not deleted'));
    }

    // Check if the product is within the 24-hour restoration window
    const timeSinceDeleted =
      new Date().getTime() - new Date(product.deletedAt!).getTime();
    const restorationWindow = 24 * 60 * 60 * 1000;

    if (timeSinceDeleted > restorationWindow) {
      return next(new ValidationError('The restoration window has expired'));
    }

    // Proceed to restore the product
    const restoredProduct = await prisma.products.update({
      where: { id: productId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    return res.status(200).json({
      message: 'Product has been restored successfully.',
      product: restoredProduct,
    });
  } catch (error) {
    return next(error);
  }
};

// get all products
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type;
    const category = req.query.category as string | undefined;
    const minPrice = req.query.minPrice
      ? parseInt(req.query.minPrice as string)
      : undefined;
    const maxPrice = req.query.maxPrice
      ? parseInt(req.query.maxPrice as string)
      : undefined;
    const rating = req.query.rating
      ? parseFloat(req.query.rating as string)
      : undefined;

    // Start building filters for Prisma query
    const andFilters: Prisma.ProductsWhereInput[] = [];
    // const now = new Date();

    // Soft delete filter
    andFilters.push({ isDeleted: false });

    // Category filter
    if (category) {
      andFilters.push({ category });
    }

    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      andFilters.push({
        salePrice: {
          gte: minPrice,
          lte: maxPrice,
        },
      });
    }

    // Rating filter
    if (rating !== undefined) {
      andFilters.push({
        ratings: { gte: rating },
      });
    }

    // Final where filter (combine all filters)
    const baseFilter: Prisma.ProductsWhereInput = {
      AND: andFilters,
    };

    // Order by logic
    const orderBy: Prisma.ProductsOrderByWithRelationInput =
      type === 'latest' ? { createdAt: 'desc' } : { totalSales: 'desc' };

    // Fetch products, count, and top 10 products (if needed)
    const [products, total, top10Products] = await Promise.all([
      prisma.products.findMany({
        skip,
        take: limit,
        where: baseFilter,
        orderBy,
        include: {
          images: true,
          shop: true,
        },
      }),
      prisma.products.count({ where: baseFilter }),
      prisma.products.findMany({
        take: 10,
        where: baseFilter,
        orderBy,
      }),
    ]);

    // Return response with paginated products and top 10
    return res.status(200).json({
      products,
      top10By: type === 'latest' ? 'latest' : 'topSales',
      top10Products,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return next(error);
  }
};

// get all events
export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type;

    const orderBy: Prisma.ProductsOrderByWithRelationInput =
      type === 'totalSales' ? { totalSales: 'desc' } : { createdAt: 'desc' };

    const now = new Date();

    const baseFilter = {
      isEvent: true,
      startingDate: { lte: now },
      endingDate: { gte: now },
    };

    // Fetch events, count, and top 10 products (if needed)
    const [events, total, top10BySales] = await Promise.all([
      prisma.products.findMany({
        skip,
        take: limit,
        where: baseFilter,
        orderBy,
        include: {
          images: true,
          shop: true,
        },
      }),
      prisma.products.count({ where: baseFilter }),
      prisma.products.findMany({
        take: 10,
        where: baseFilter,
        orderBy: { totalSales: 'desc' },
      }),
    ]);

    // Return response with paginated products and top 10
    return res.status(200).json({
      events,
      top10BySales,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return next(error);
  }
};

// get product details
export const getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const product = await prisma.products.findUnique({
      where: {
        slug: req.params.slug,
      },
      include: {
        images: true,
        shop: true,
      },
    });
    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return next(error);
  }
};

// get filterd products
export const getFilteredProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      priceRange = [0, 10000],
      categories = [],
      colors = [],
      sizes = [],
      page = 1,
      limit = 12,
    } = req.query;

    const parsedPriceRange =
      typeof priceRange === 'string'
        ? priceRange.split(',').map(Number)
        : [0, 10000];

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {
      salePrice: {
        gte: parsedPriceRange[0],
        lte: parsedPriceRange[1],
      },
      isEvent: false,
    };

    if (categories && (categories as string[]).length > 0) {
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(','),
      };
    }

    if (colors && (colors as string[]).length > 0) {
      filters.colors = {
        hasSome: Array.isArray(colors) ? colors : [colors],
      };
    }

    if (sizes && (sizes as string[]).length > 0) {
      filters.sizes = {
        hasSome: Array.isArray(sizes) ? sizes : [sizes],
      };
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          images: true,
          shop: true,
        },
      }),
      prisma.products.count({ where: filters }),
    ]);

    console.log('Products', products);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.json({
      products,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// get filterd offers
export const getFilteredEvents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      priceRange = [0, 10000],
      categories = [],
      colors = [],
      sizes = [],
      page = 1,
      limit = 12,
    } = req.query;

    const parsedPriceRange =
      typeof priceRange === 'string'
        ? priceRange.split(',').map(Number)
        : [0, 10000];

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const skip = (parsedPage - 1) * parsedLimit;

    const now = new Date();

    const filters: Record<string, any> = {
      isEvent: true,
      startingDate: {
        lte: now,
      },
      endingDate: {
        gte: now,
      },
      salePrice: {
        gte: parsedPriceRange[0],
        lte: parsedPriceRange[1],
      },
    };

    if (categories && (categories as string[]).length > 0) {
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(','),
      };
    }

    if (colors && (colors as string[]).length > 0) {
      filters.colors = {
        hasSome: Array.isArray(colors) ? colors : [colors],
      };
    }

    if (sizes && (sizes as string[]).length > 0) {
      filters.sizes = {
        hasSome: Array.isArray(sizes) ? sizes : [sizes],
      };
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          images: true,
          shop: true,
        },
      }),
      prisma.products.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.json({
      products,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// get filterd shops
export const getFilteredShops = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      categories = [],
      countries = [],

      page = 1,
      limit = 12,
    } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {};

    if (categories && (categories as string[]).length > 0) {
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(','),
      };
    }

    if (countries && (countries as string[]).length > 0) {
      filters.country = {
        in: Array.isArray(countries) ? countries : [countries],
      };
    }

    const [shops, total] = await Promise.all([
      prisma.shops.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          sellers: true,
          products: true,
        },
      }),
      prisma.shops.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.json({
      shops,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// search products
export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    const products = await prisma.products.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            shortDescription: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      products,
    });
  } catch (error) {
    return next(error);
  }
};

// top shops
export const topShops = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Aggregate total sales per shop from orders
    const topShopsData = await prisma.orders.groupBy({
      by: ['shopId'],
      _sum: {
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: 10,
    });

    // Fetch corresponding shop details
    const shopIds = topShopsData.map((item: any) => item.shopId);

    const shops = await prisma.shops.findMany({
      where: {
        id: {
          in: shopIds,
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        coverBanner: true,
        address: true,
        ratings: true,
        followers: true,
        category: true,
      },
    });

    // Merge sales with shop data
    const enrichedShops = shops.map((shop) => {
      const salesData = topShopsData.find((s: any) => s.shopId === shop.id);
      return {
        ...shop,
        totalSales: salesData?._sum.total ?? 0,
      };
    });

    const top10Shops = enrichedShops
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);
    return res.status(200).json({
      shops: top10Shops,
    });
  } catch (error) {
    console.log('Error fetching top shops: ', error);
    return next(error);
  }
};
