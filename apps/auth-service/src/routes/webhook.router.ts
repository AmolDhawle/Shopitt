import express from 'express';
import { stripeWebhook } from '../controllers/stripe.webhook.controller';

const router = express.Router();

// Stripe needs raw body
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook,
);

export default router;