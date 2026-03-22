import express from 'express';
import {
  getSellerDetails,
  getSellerProducts,
  getSellerEvents,
  followShop,
  unfollowShop,
  isFollowingShop,
  sellerNotifications,
  markNotificationAsRead,
} from '../controllers/seller.controller';
import { authorizeRole, requireAuth } from '@shopitt/middleware';

const router = express.Router();

router.get('/get-seller/:id', getSellerDetails);
router.get('/get-seller-products/:shopId', getSellerProducts);
router.get('/get-seller-events/:shopId', getSellerEvents);
router.get(
  '/get-seller-notifications',
  requireAuth,
  authorizeRole('seller'),
  sellerNotifications,
);
router.get('/is-following/:shopId', requireAuth, isFollowingShop);

router.post('/follow-shop', requireAuth, followShop);
router.post('/unfollow-shop', requireAuth, unfollowShop);
router.post('/mark-notification-as-read', requireAuth, markNotificationAsRead);

export default router;
