import express, { Router } from 'express';
import {
  createDiscountCode,
  createEventForProducts,
  createProduct,
  deleteDiscountCode,
  deleteProduct,
  deleteProductImage,
  getAllEvents,
  getAllProducts,
  getCategories,
  getDiscountCodes,
  getFilteredEvents,
  getFilteredProducts,
  getFilteredShops,
  getProductDetails,
  getShopProducts,
  restoreProduct,
  searchProducts,
  topShops,
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

router.post(
  '/create-event/:shopId',
  requireAuth,
  authorizeRole('seller'),
  createEventForProducts,
);

router.get(
  '/get-shop-products',
  requireAuth,
  authorizeRole('seller'),
  getShopProducts,
);

router.delete(
  '/delete-product/:productId',
  requireAuth,
  authorizeRole('seller'),
  deleteProduct,
);
router.put(
  '/restore-product/:productId',
  requireAuth,
  authorizeRole('seller'),
  restoreProduct,
);

router.get('/get-all-products', getAllProducts);
router.get('/get-all-events', getAllEvents);
router.get('/get-product/:slug', getProductDetails);
router.get('/get-filtered-products', getFilteredProducts);
router.get('/get-filtered-offers', getFilteredEvents);
router.get('/get-filtered-shops', getFilteredShops);
router.get('/search-products', searchProducts);
router.get('/top-shops', topShops);

export default router;
