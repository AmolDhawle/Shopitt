import {
  BadRequestError,
  NotFoundError,
  ValidationError,
} from '@shopitt/error-handler';
import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { redis } from '@shopitt/redis';
import { prisma } from '@shopitt/prisma-client';
import crypto from 'crypto';
import { sendEmail } from '../utils/send-email';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

interface CartItem {
  id: string;
  shopId: string;
  salePrice: number;
  quantity: number;
  discountCode?: string[];
}

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
      amount: totalAmount * 100,
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

  const result = await prisma.$transaction(async (tx) => {
    const orderGroup = await tx.orderGroups.create({
      data: {
        userId,
        totalAmount: pricing.totalAmount,
        paymentStatus: 'PAID',
        paymentMethod: 'STRIPE',
        transactionId: paymentIntent.id,
      },
    });

    const orders = [];

    for (const seller of sellers) {
      console.log('seller', seller);
      const items = shopGrouped[seller.shopId];
      if (!items) continue;

      const subtotal = items.reduce(
        (sum: number, i: any) => sum + i.quantity * i.salePrice,
        0,
      );

      const discount = coupon?.discountAmount || 0;
      const total = subtotal - discount;

      const order = await tx.orders.create({
        data: {
          orderGroup: {
            connect: { id: orderGroup.id },
          },
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
          statusHistory: {
            create: [
              { status: 'ORDER_PLACED' },
              { status: 'PAYMENT_CONFIRMED' },
            ],
          },
          items: {
            create: items.map((item: any) => ({
              product: { connect: { id: item.id } },
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
      // amount: sellerAmount,
      // currency: 'inr',
      // destination: seller.stripeAccountId,
      // source_transaction: paymentIntent.latest_charge as string,
      // description: Payout for order ${order.id},
      // });

      console.log('Creating notification for seller:', seller.sellerId);

      // 1. Seller notification
      await tx.notifications.create({
        data: {
          receiverId: seller.sellerId,
          receiverType: 'SELLER',
          type: 'ORDER',
          title: 'New Order Received',
          message: `You received a new order #${order.id}`,
          isRead: false,
          redirectLink: `/orders/${order.id}`,
          entityId: orderGroup.id,
        },
      });

      orders.push(order);
    }

    // 2. User notification
    await tx.notifications.create({
      data: {
        receiverId: userId,
        receiverType: 'USER',
        type: 'ORDER',
        title: 'Order Placed Successfully',
        message: `Your order #${orderGroup.id} has been placed successfully`,
        isRead: false,
        redirectLink: `/order/${orderGroup.id}`,
      },
    });

    // 3. Admin notification
    const admins = await tx.users.findMany({
      where: {
        role: 'ADMIN',
      },
      select: {
        id: true,
      },
    });

    console.log('Admin', admins);

    await tx.notifications.createMany({
      data: admins.map((admin) => ({
        receiverId: admin.id,
        receiverType: 'ADMIN',
        type: 'ORDER',
        title: 'New Order Placed',
        message: `A new order #${orderGroup.id} has been placed by ${user.name}`,
        isRead: false,
        redirectLink: `/admin/orders/${orderGroup.id}`,
        entityId: orderGroup.id,
      })),
    });

    return { orderGroup, orders };
  });

  await sendEmail(user.email, 'Order Confirmation', 'order-confirmation', {
    name: user.name,
    cart,
    totalAmount: pricing.totalAmount,
    trackingUrl: `/order/${result.orderGroup.id}`,
  });

  await redis.del(`payment-session:${sessionId}`);

  return res.json({ received: true });
};

// get all orders
export const getSellerOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shop = await prisma.shops.findUnique({
      where: {
        sellerId: req.seller?.id,
      },
    });

    // fetch all orders for this shop
    const orders = await prisma.orders.findMany({
      where: {
        shopId: shop?.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        orderGroup: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return next(error);
  }
};

// get order details
export const getOrderDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orderId = req.params.id;
    const order = await prisma.orders.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: true,
        statusHistory: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!order) {
      return next(new ValidationError('Order not found with the id!'));
    }

    const shippingAddress = order.shippingAddressId
      ? await prisma.address.findUnique({
          where: {
            id: order?.shippingAddressId,
          },
        })
      : null;

    const coupon =
      order.couponCode && order.shopId
        ? await prisma.discountCode.findUnique({
            where: {
              discountCode_shopId: {
                discountCode: order.couponCode,
                shopId: order.shopId,
              },
            },
          })
        : null;

    // fetch all product details
    const productIds = order.items.map((item) => item.productId);

    const products = await prisma.products.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        title: true,
        images: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = order.items.map((item) => ({
      ...item,
      selectedOptions: {
        size: item.size,
        color: item.color,
      },
      product: productMap.get(item.productId) || null,
    }));

    return res.status(200).json({
      success: true,
      order: {
        ...order,
        items,
        shippingAddress,
        couponCode: coupon,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// update order status
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const orderId = id;
    const { status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        error: 'Missing order ID or status.',
      });
    }

    const allowedStatuses = [
      'ORDER_PLACED',
      'PAYMENT_CONFIRMED',
      'PACKED',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ];

    if (!allowedStatuses.includes(status)) {
      return next(new ValidationError('Invalid order status'));
    }

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        statusHistory: true,
      },
    });

    if (!order) {
      return next(new NotFoundError('Order not found'));
    }

    // map timeline → orderStatus
    let orderStatus = order.orderStatus;

    if (
      status === 'PACKED' ||
      status === 'SHIPPED' ||
      status === 'OUT_FOR_DELIVERY'
    ) {
      orderStatus = 'SHIPPED';
    }

    if (status === 'DELIVERED') {
      orderStatus = 'DELIVERED';
    }

    if (status === 'CANCELLED') {
      orderStatus = 'CANCELLED';
    }

    const [updatedOrder] = await prisma.$transaction([
      prisma.orders.update({
        where: { id: orderId },
        data: {
          orderStatus,
        },
      }),

      prisma.orderStatusHistory.create({
        data: {
          orderId,
          status,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyCouponCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { couponCode, cart } = req.body as {
      couponCode: string;
      cart: CartItem[];
    };

    if (!couponCode || !cart?.length) {
      return next(new ValidationError('Coupon code and cart are required'));
    }

    // Extract shop IDs and find the discount
    const shopIds = [...new Set(cart.map((i) => i.shopId))].filter(
      (id): id is string => typeof id === 'string',
    );

    let discount;

    for (const shopId of shopIds) {
      discount = await prisma.discountCode.findFirst({
        where: {
          discountCode: couponCode,
          shopId,
          isActive: true,
          expiresAt: { gte: new Date() },
        },
      });
      if (discount) break;
    }

    if (!discount) {
      return next(new ValidationError("Coupon code isn't valid for this cart"));
    }

    // Apply discount to matching products
    const discountIdSet = new Set([discount.id]);
    const matchingProducts = cart.filter((item) =>
      item.discountCode?.some((d) => discountIdSet.has(d)),
    );

    if (!matchingProducts.length) {
      return res.status(200).json({
        valid: false,
        discountAmount: 0,
        message: 'No eligible product found in cart for this coupon',
      });
    }

    let discountAmount = 0;

    for (const item of matchingProducts) {
      const price = item.salePrice * item.quantity;
      let itemDiscount = 0;

      if (discount.discountType === 'PERCENTAGE') {
        itemDiscount = (price * discount.discountValue) / 100;
      } else if (discount.discountType === 'FIXED') {
        itemDiscount = discount.discountValue;
      }

      discountAmount += Math.min(itemDiscount, price);
    }

    return res.status(200).json({
      valid: true,
      discount: discount.discountValue,
      discountAmount, // number
      discountedProductIds: matchingProducts.map((p) => p.id),
      discountType: discount.discountType,
      message: `Discount applied to ${matchingProducts.length} eligible product(s)`,
    });
  } catch (error) {
    return next(error);
  }
};

// get user orders
export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orders = await prisma.orders.findMany({
      where: {
        userId: req.user?.id,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return next(error);
  }
};

// get admin orders
export const getAdminOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Fetch all orders
    const orders = await prisma.orders.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        shop: true,
      },
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return next(error);
  }
};
