import 'express';
import { UserContext } from './userContext.ts';
import { SellerContext } from './sellerContext.ts';
import { AdminContext } from './adminContext.ts';

declare module 'express-serve-static-core' {
  interface Request {
    role?: 'user' | 'seller' | 'admin';
    user?: UserContext;
    seller?: SellerContext;
    admin?: AdminContext;
  }
}
