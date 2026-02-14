import express, { Router } from 'express';
import {
  createDiscountCode,
  deleteDiscountCode,
  getCategories,
  getDiscountCodes,
} from '../controllers/product.controller';
import { authorizeRole, requireAuth } from '@shopitt/middleware';

const router: Router = express.Router();

router.get('/get-categories', getCategories);
router.post(
  '/create-discount-code',
  requireAuth,
  authorizeRole('seller'),
  createDiscountCode,
);
router.get(
  '/get-discount-codes',
  requireAuth,
  authorizeRole('seller'),
  getDiscountCodes,
);
router.delete(
  '/delete-discount-code/:id',
  requireAuth,
  authorizeRole('seller'),
  deleteDiscountCode,
);

export default router;
