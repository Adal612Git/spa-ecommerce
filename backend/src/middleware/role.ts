import type { RequestHandler } from 'express';
import type { Role } from '@prisma/client';

export const requireRole = (...roles: Role[]): RequestHandler => {
  return (req, res, next) => {
    const user = req.user as { role: Role } | undefined;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};
