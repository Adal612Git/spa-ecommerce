import express from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';

export function createCouponsRouter(prisma: PrismaClient) {
  const router = express.Router();

  const createSchema = z.object({
    code: z.string().min(3),
    type: z.enum(['PERCENTAGE', 'FIXED']),
    value: z.number().int().positive(),
    expiresAt: z.string().transform((d) => new Date(d)),
    usageLimit: z.number().int().positive(),
  });

  router.post('/', async (req, res, next) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
      const coupon = await prisma.coupon.create({ data: parsed.data });
      res.status(201).json(coupon);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:code', async (req, res, next) => {
    const total = Number(req.query.total || 0);
    try {
      const coupon = await prisma.coupon.findUnique({ where: { code: req.params.code } });
      if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
      if (coupon.expiresAt < new Date()) return res.status(400).json({ error: 'Coupon expired' });
      if (coupon.usedCount >= coupon.usageLimit)
        return res.status(400).json({ error: 'Coupon usage limit reached' });
      const discount = coupon.type === 'PERCENTAGE'
        ? Math.floor((total * coupon.value) / 100)
        : coupon.value;
      if (discount > total) return res.status(400).json({ error: 'Discount exceeds total' });
      res.json({ ...coupon, discount });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/use', async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      const coupon = await prisma.coupon.update({
        where: { id },
        data: { usedCount: { increment: 1 } },
      });
      res.json(coupon);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
