import { Users } from '@shopitt/prisma';
import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: Users;
  }
}
