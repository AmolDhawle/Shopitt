import { authorizeRole, requireAuth } from '@shopitt/middleware';
import express, { Router } from 'express';
import {
  addNewAdmin,
  getAllAdmins,
  getAllCustomizations,
  getAllEvents,
  getAllProducts,
  getAllSellers,
  getAllUsers,
} from '../controllers/admin.controller';

const router: Router = express.Router();

router.get(
  '/get-all-products',
  requireAuth,
  authorizeRole('admin'),
  getAllProducts,
);
router.get(
  '/get-all-events',
  requireAuth,
  authorizeRole('admin'),
  getAllEvents,
);
router.get(
  '/get-all-admins',
  requireAuth,
  authorizeRole('admin'),
  getAllAdmins,
);
router.put('/add new admin', requireAuth, authorizeRole('admin'), addNewAdmin);
router.get('/get-all-customizations', getAllCustomizations);
router.get('/get-all-users', requireAuth, authorizeRole('admin'), getAllUsers);
router.get(
  '/get-all-sellers',
  requireAuth,
  authorizeRole('admin'),
  getAllSellers,
);

export default router;
