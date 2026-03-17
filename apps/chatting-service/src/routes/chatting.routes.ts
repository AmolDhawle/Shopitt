import { authorizeRole, requireAuth } from '@shopitt/middleware';
import express, { Router } from 'express';
import {
  fetchSellerMessages,
  fetchUserMessages,
  getSellerConversations,
  getUserConversations,
  newConversation,
} from '../controllers/chatting.controller';

const router: Router = express.Router();

router.post('/create-user-conversationGroup', requireAuth, newConversation);
router.get('/get-user-conversations', requireAuth, getUserConversations);
router.get(
  '/get-seller-conversations',
  requireAuth,
  authorizeRole('seller'),
  getSellerConversations,
);
router.get(
  '/get-user-messages/:conversationId',
  requireAuth,
  fetchUserMessages,
);
router.get(
  '/get-seller-messages/:conversationId',
  requireAuth,
  authorizeRole('seller'),
  fetchSellerMessages,
);

export default router;
