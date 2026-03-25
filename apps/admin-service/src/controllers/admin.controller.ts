import { Request, Response, NextFunction } from 'express';
import { prisma } from '@shopitt/prisma-client';
import { ValidationError } from '@shopitt/error-handler';

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

    const [products, totalProducts] = await Promise.all([
      prisma.products.findMany({
        where: {
          startingDate: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          salePrice: true,
          stock: true,
          createdAt: true,
          ratings: true,
          category: true,
          images: {
            select: { url: true },
            take: 1,
          },
          shop: {
            select: { name: true },
          },
        },
      }),
      prisma.products.count({
        where: {
          startingDate: null,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    return res.status(200).json({
      success: true,
      products,
      meta: {
        totalProducts,
        currentPage: page,
        totalPages,
      },
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

    const [events, totalEvents] = await Promise.all([
      prisma.products.findMany({
        where: {
          startingDate: {
            not: null,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          salePrice: true,
          stock: true,
          createdAt: true,
          startingDate: true,
          endingDate: true,

          images: {
            select: { url: true },
            take: 1,
          },
          shop: {
            select: { name: true },
          },
        },
      }),
      prisma.products.count({
        where: {
          startingDate: {
            not: null,
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalEvents / limit);

    return res.status(200).json({
      success: true,
      events,
      meta: {
        totalEvents,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// get all admins
export const getAllAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admins = await prisma.users.findMany({
      where: {
        role: 'ADMIN',
      },
    });

    return res.status(200).json({
      success: true,
      admins,
    });
  } catch (error) {
    return next(error);
  }
};

// add new admin
export const addNewAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, role } = req.body;

    const isUser = await prisma.users.findUnique({ where: { email } });

    if (!isUser) {
      return next(new ValidationError('Something went wrong!'));
    }

    const updateRole = await prisma.users.update({
      where: { email },
      data: {
        role,
      },
    });

    return res.status(201).json({
      success: true,
      updateRole,
    });
  } catch (error) {
    return next(error);
  }
};

// fetch all customizations
export const getAllCustomizations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const config = await prisma.siteConfig.findFirst();

    return res.status(200).json({
      categories: config?.categories || [],
      subCategories: config?.subCategories || {},
      logo: config?.logo || null,
      banner: config?.banner || null,
    });
  } catch (error) {
    return next(error);
  }
};

// get all users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      prisma.users.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.users.count(),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      success: true,
      users,
      meta: {
        totalUsers,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
};

//get all sellers
export const getAllSellers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [sellers, totalSellers] = await Promise.all([
      prisma.sellers.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,

          createdAt: true,
          shop: {
            select: {
              name: true,
              avatar: true,
              address: true,
            },
          },
        },
      }),
      prisma.sellers.count(),
    ]);

    const totalPages = Math.ceil(totalSellers / limit);

    return res.status(200).json({
      success: true,
      sellers,
      meta: {
        totalSellers,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// get all notifications
export const getAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const notifications = await prisma.notifications.findMany({
      where: {
        receiverId: adminId,
        receiverType: 'ADMIN',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    return next(error);
  }
};
