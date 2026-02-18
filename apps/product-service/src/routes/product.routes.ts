import express, { Router } from 'express';
import {
  createDiscountCode,
  createProduct,
  deleteDiscountCode,
  deleteProductImage,
  getCategories,
  getDiscountCodes,
  uploadProductImage,
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
router.post(
  '/upload-product-image',
  requireAuth,
  authorizeRole('seller'),
  uploadProductImage,
);
router.delete(
  '/delete-product-image',
  requireAuth,
  authorizeRole('seller'),
  deleteProductImage,
);
router.post(
  '/create-product',
  requireAuth,
  authorizeRole('seller'),
  createProduct,
);

export default router;
