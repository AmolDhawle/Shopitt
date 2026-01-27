import { prisma } from '@shopitt/prisma-client';
import { stripe } from './auth.controller';
import { Response } from 'express';
import { SellerContext } from '@shopitt/middleware';

export const handleStripeOnboarding = async (
  seller: SellerContext,
  res: Response,
) => {
  let stripeAccountId = seller.stripeId;

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: 'standard',
      email: seller.email,
      country: seller.country_code, // e.g. IN, GB
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    stripeAccountId = account.id;

    await prisma.sellers.update({
      where: { id: seller.id },
      data: {
        stripeId: stripeAccountId,
        paymentStatus: 'ONBOARDING',
      },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${process.env.CLIENT_URL}/onboarding/refresh`,
    return_url: `${process.env.CLIENT_URL}/onboarding/success`,
    type: 'account_onboarding',
  });

  res.json({ success: true, url: accountLink.url });
};
