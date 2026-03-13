import express, { Router } from 'express';
import {
  getMe,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  registerSeller,
  resetUserPassword,
  userForgotPassword,
  verifyUser,
  verifySeller,
  verifyUserForPasswordReset,
  createShop,
  getSeller,
  loginSeller,
  updateUserPassword,
  loginAdmin,
  getAdmin,
} from '../controllers/auth.controller';
import { requireAuth } from '@shopitt/middleware';
import { authorizeRole } from '@shopitt/middleware';
import { createPaymentOnboarding } from '../controllers/payment.controller';

const router: Router = express.Router();

router.get('/health', (req, res) => {
  res.send({ status: 'Auth Service is healthy' });
});

router.post('/register-user', registerUser);
router.post('/verify-user', verifyUser);
router.post('/login-user', loginUser);
router.post('/refresh', refreshToken);
router.get('/me', requireAuth, authorizeRole('user'), getMe);
router.post('/logout', logoutUser);

router.post('/register-seller', registerSeller);
router.post('/verify-seller', verifySeller);
router.post('/login-seller', loginSeller);
router.get('/seller/me', requireAuth, authorizeRole('seller'), getSeller);

router.post('/create-shop', requireAuth, authorizeRole('seller'), createShop);
router.post(
  '/payment/onboard',
  requireAuth,
  authorizeRole('seller'),
  createPaymentOnboarding,
);

router.post('/forgot-password', userForgotPassword);
router.post('/forgot-password/verify-otp', verifyUserForPasswordReset);
router.post('/forgot-password/reset', resetUserPassword);
router.post('/change-password', requireAuth, updateUserPassword);
router.post('/login-admin', loginAdmin);
router.get('/admin/me', requireAuth, authorizeRole('admin'), getAdmin);

export default router;
