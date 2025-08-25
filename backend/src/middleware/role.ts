import type { RequestHandler } from 'express';
import type { User } from '@prisma/client';

export function requireRole(role: string): RequestHandler {
  return (req, res, next) => {
    const user = req.user as User | undefined;
    if (!user || user.role !== role) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    next();
  };
}
