import express, { Router } from 'express';
import {
  createPaymentIntent,
  createPaymentSession,
  verifyingPaymentSession,
} from '../controllers/order.controller';
import { requireAuth } from '@shopitt/middleware';

const router: Router = express.Router();

router.post('/create-payment-intent', requireAuth, createPaymentIntent);
router.post('/create-payment-session', requireAuth, createPaymentSession);
router.get('/verifying-payment-session', requireAuth, verifyingPaymentSession);

export default router;
