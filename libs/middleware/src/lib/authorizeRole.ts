import { Request, Response, NextFunction } from 'express';

export const authorizeRole = (requiredRole: 'user' | 'seller' | 'admin') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role || req.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message:
          'Forbidden: You do not have the required role to access this resource.',
      });
    }

    return next();
  };
};
