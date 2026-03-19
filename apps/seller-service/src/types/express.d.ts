import { UserContext } from '@shopitt/middleware'; // or wherever your types live
import { SellerContext } from '@shopitt/middleware';
import { AdminContext } from '@shopitt/middleware';

declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
      seller?: SellerContext;
      admin?: AdminContext;
      role?: 'user' | 'seller' | 'admin';
    }
  }
}
