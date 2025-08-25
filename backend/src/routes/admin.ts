import express from 'express';
import passport from 'passport';
import type { PrismaClient } from '@prisma/client';
// eslint-disable-next-line import/no-unresolved
import { requireRole } from '../middleware/role.js';

export function createAdminRouter(prisma: PrismaClient) {
  const router = express.Router();

  router.get(
    '/orders',
    passport.authenticate('jwt', { session: false }),
    requireRole('ADMIN'),
    async (req, res, next) => {
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '10', 10);
      const skip = (page - 1) * limit;
      try {
        const [orders, total] = await Promise.all([
          prisma.order.findMany({
            select: { id: true, status: true, total_cents: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.order.count(),
        ]);
        const mapped = orders.map((o) => ({
          id: o.id,
          status: o.status,
          total_cents: o.total_cents,
          created_at: o.createdAt.toISOString(),
        }));
        res.json({ orders: mapped, total, page, limit });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
