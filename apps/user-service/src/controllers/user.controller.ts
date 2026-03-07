import { NotFoundError, ValidationError } from '@shopitt/error-handler';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@shopitt/prisma-client';

// add new address
export const addUserAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { label, line1, line2, city, postalCode, country, isDefault } =
      req.body;

    if (!label || !line1 || !line2 || !city || !postalCode || !country) {
      return new ValidationError('All fields are required');
    }

    if (!userId) {
      return next(new ValidationError('Unauthorized'));
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        label,
        line1,
        city,
        line2,
        postalCode,
        country,
        isDefault,
      },
    });

    res.status(201).json({
      success: true,
      address: newAddress,
    });
  } catch (error) {
    return next(error);
  }
};

// delete user address
export const deleteUserAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;

    if (!addressId) {
      return next(new ValidationError('Address ID is required'));
    }

    const exisitingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!exisitingAddress) {
      return next(new NotFoundError('Address not found or unauthorized'));
    }

    await prisma.address.delete({
      where: {
        id: addressId,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Address deleted sucessfully',
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserAddresses = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;

    const addresses = await prisma.address.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    return next(error);
  }
};
