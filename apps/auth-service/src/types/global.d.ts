import { Users } from '@shopitt/prisma';
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: Users;
  }
}
