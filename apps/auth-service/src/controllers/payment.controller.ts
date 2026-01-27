import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '@shopitt/error-handler';
import { handleStripeOnboarding } from './stripe.controller';

export const createPaymentOnboarding = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const seller = req.seller;
    if (!seller) throw new BadRequestError('Unauthorized');

    return handleStripeOnboarding(seller, res);
  } catch (err) {
    next(err);
  }
};