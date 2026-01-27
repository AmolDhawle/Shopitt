import { Request, Response } from 'express';
import { stripe } from './auth.controller';
import { prisma } from '@shopitt/prisma-client';

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error`);
  }

  if (event.type === 'account.updated') {
    const account = event.data.object;

    if (account.charges_enabled && account.payouts_enabled) {
      await prisma.sellers.updateMany({
        where: { stripeId: account.id },
        data: { paymentStatus: 'active' },
      });
    } else {
      await prisma.sellers.updateMany({
        where: { stripeId: account.id },
        data: { paymentStatus: 'restricted' },
      });
    }
  }

  return res.json({ received: true });
};
