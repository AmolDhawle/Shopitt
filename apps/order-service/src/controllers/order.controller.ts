import { BadRequestError } from '@shopitt/error-handler';
import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { redis } from '@shopitt/redis';
import { prisma } from '@shopitt/prisma-client';
import crypto from 'crypto';
import { sendEmail } from '../utils/send-email';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

/**
 * CREATE PAYMENT SESSION
 */
export const createPaymentSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { cart, selectedAddressId, coupon } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new BadRequestError('User not authenticated.');
    if (!cart || !Array.isArray(cart) || cart.length === 0)
      throw new BadRequestError('Cart is empty or invalid.');

    const uniqueShopIds = [...new Set(cart.map((item: any) => item.shopId))];

    const shops = await prisma.shops.findMany({
      where: { id: { in: uniqueShopIds } },
      select: {
        id: true,
        sellerId: true,
        sellers: { select: { stripeId: true } },
      },
    });

    const sellerData = shops.map((shop) => {
      if (!shop.sellers?.stripeId) {
        throw new BadRequestError(
          `Seller for shop ${shop.id} has not connected Stripe.`,
        );
      }

      return {
        shopId: shop.id,
        sellerId: shop.sellerId,
        stripeAccountId: shop.sellers.stripeId,
      };
    });

    const subtotal = cart.reduce(
      (total: number, item: any) => total + item.quantity * item.salePrice,
      0,
    );

    const discount = coupon?.discountAmount || 0;
    const tax = 0;
    const shippingFee = 0;

    const totalAmount = subtotal - discount + tax + shippingFee;

    const sessionId = crypto.randomUUID();

    const sessionData = {
      userId,
      cart,
      sellers: sellerData,
      pricing: { subtotal, discount, tax, shippingFee, totalAmount },
      shippingAddressId: selectedAddressId || null,
      coupon: coupon || null,
    };

    await redis.setex(
      `payment-session:${sessionId}`,
      600,
      JSON.stringify(sessionData),
    );

    return res.status(201).json({ sessionId });
  } catch (error) {
    return next(error);
  }
};

/**
 * CREATE PAYMENT INTENT
 */
export const createPaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      throw new BadRequestError('SessionId is required.');
    }

    const sessionData = await redis.get(`payment-session:${sessionId}`);

    if (!sessionData) {
      throw new BadRequestError('Payment session expired.');
    }

    const session = JSON.parse(sessionData);

    const totalAmount = session.pricing.totalAmount;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'inr',
      payment_method_types: ['card'],
      description: `Payout for order `,

      metadata: {
        sessionId,
        userId: session.userId,
      },
    });

    return res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * VERIFY PAYMENT SESSION
 */
export const verifyingPaymentSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      throw new BadRequestError('Session ID is required.');
    }

    const sessionData = await redis.get(`payment-session:${sessionId}`);

    if (!sessionData) {
      return res.status(400).json({
        success: false,
        error: 'Session expired',
      });
    }

    const session = JSON.parse(sessionData);

    /**
     * Fetch user details
     */
    const user = await prisma.users.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    /**
     * Fetch shipping address
     */
    const address = await prisma.address.findUnique({
      where: { id: session.shippingAddressId },
      select: {
        id: true,
        line1: true,
        line2: true,
        city: true,
        postalCode: true,
        country: true,
      },
    });

    return res.json({
      success: true,
      session,
      user,
      address,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * STRIPE WEBHOOK
 * Handles:
 * 1. Order creation
 * 2. Seller payouts
 */
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error('Webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type !== 'payment_intent.succeeded') {
    return res.json({ received: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  const { sessionId, userId } = paymentIntent.metadata;

  const sessionData = await redis.get(`payment-session:${sessionId}`);

  if (!sessionData) {
    console.warn('Session expired:', sessionId);
    return res.json({ received: true });
  }

  const { cart, sellers, shippingAddressId, coupon, pricing } =
    JSON.parse(sessionData);

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (!user) return res.status(404).send('User not found');

  const shopGrouped = cart.reduce((acc: any, item: any) => {
    if (!acc[item.shopId]) acc[item.shopId] = [];
    acc[item.shopId].push(item);
    return acc;
  }, {});

  await prisma.$transaction(async (tx) => {
    for (const seller of sellers) {
      const items = shopGrouped[seller.shopId];

      if (!items) continue;

      const subtotal = items.reduce(
        (sum: number, i: any) => sum + i.quantity * i.salePrice,
        0,
      );

      const discount = coupon?.discountAmount || 0;
      const total = subtotal - discount;

      await tx.orders.create({
        data: {
          user: {
            connect: { id: userId },
          },
          shop: {
            connect: { id: seller.shopId },
          },
          subtotal,
          discount,
          total,
          couponCode: coupon?.code || '',
          paymentStatus: 'PAID',
          orderStatus: 'CONFIRMED',
          paymentMethod: 'STRIPE',
          transactionId: paymentIntent.id,
          shippingAddress: shippingAddressId
            ? { connect: { id: shippingAddressId } }
            : undefined,
          items: {
            create: items.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.salePrice,
              size: item.selectedOptions?.size || null,
              color: item.selectedOptions?.color || null,
            })),
          },
        },
      });

      // Doesn't work for indian sellers/accounts

      // await stripe.transfers.create({
      //   amount: sellerAmount,
      //   currency: 'inr',
      //   destination: seller.stripeAccountId,
      //   source_transaction: paymentIntent.latest_charge as string,
      //   description: `Payout for order ${order.id}`,
      // });
    }
  });

  await sendEmail(user.email, 'Order Confirmation', 'order-confirmation', {
    name: user.name,
    cart,
    totalAmount: pricing.totalAmount,
  });

  await redis.del(`payment-session:${sessionId}`);

  return res.json({ received: true });
};
