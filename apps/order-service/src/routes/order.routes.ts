import express, { Router } from 'express';
import {
  createPaymentIntent,
  createPaymentSession,
  getOrderDetails,
  getSellerOrders,
  getUserOrders,
  updateOrderStatus,
  verifyCouponCode,
  verifyingPaymentSession,
} from '../controllers/order.controller';
import { authorizeRole, requireAuth } from '@shopitt/middleware';

const router: Router = express.Router();

router.post('/create-payment-intent', requireAuth, createPaymentIntent);
router.post('/create-payment-session', requireAuth, createPaymentSession);
router.get('/verifying-payment-session', requireAuth, verifyingPaymentSession);
router.get(
  '/get-seller-orders',
  requireAuth,
  authorizeRole('seller'),
  getSellerOrders,
);
router.get('/get-order-details/:id', requireAuth, getOrderDetails);
router.put(
  '/update-status/:id',
  requireAuth,
  authorizeRole('seller'),
  updateOrderStatus,
);
router.put('/verify-coupon', requireAuth, verifyCouponCode);
router.get('/get-user-orders', requireAuth, getUserOrders);

export default router;
