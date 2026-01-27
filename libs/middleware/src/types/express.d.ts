
import 'express';
import { UserContext } from './userContext.ts';
import { SellerContext } from './sellerContext.ts';

declare module 'express-serve-static-core' {
  interface Request {
    role?: 'user' | 'seller';
    user?: UserContext;
    seller?: SellerContext;
  }
}
