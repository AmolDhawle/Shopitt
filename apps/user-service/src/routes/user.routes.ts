import { requireAuth } from '@shopitt/middleware';
import express, { Router } from 'express';
import {
  addUserAddress,
  deleteUserAddress,
  getUserAddresses,
  getUserNotifications,
} from '../controllers/user.controller';

const router: Router = express.Router();

router.get('/shipping-addresses', requireAuth, getUserAddresses);
router.get('/get-user-notifications', requireAuth, getUserNotifications);
router.post('/add-address', requireAuth, addUserAddress);
router.delete('/delete-address/:addressId', requireAuth, deleteUserAddress);

export default router;
