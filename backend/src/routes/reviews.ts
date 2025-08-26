import express from 'express';
import { PrismaClient, ReviewStatus } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

export function createReviewsRouter(prisma: PrismaClient) {
  const router = express.Router();

  router.get(
    '/',
    authenticate,
    requireRole('ADMIN', 'MODERATOR'),
    async (req, res) => {
      const { status } = req.query;
      const reviews = await prisma.review.findMany({
        where: status ? { status: status as ReviewStatus } : {},
        include: {
          user: { select: { email: true } },
          product: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(reviews);
    }
  );

  router.patch(
    '/:id/status',
    authenticate,
    requireRole('ADMIN', 'MODERATOR'),
    async (req, res) => {
      const { status } = req.body;
      const review = await prisma.review.update({
        where: { id: Number(req.params.id) },
        data: { status },
      });
      res.json(review);
    }
  );

  return router;
}
