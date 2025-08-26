import express from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';

export function createShippingRouter(prisma: PrismaClient) {
  const router = express.Router();

  const rateSchema = z.object({
    id: z.number().int().optional(),
    zone: z.string(),
    minWeight: z.number().int(),
    maxWeight: z.number().int(),
    priceCents: z.number().int(),
  });

  router.get('/:zone', async (req, res, next) => {
    try {
      const rates = await prisma.shippingRate.findMany({
        where: { zone: req.params.zone },
        orderBy: { minWeight: 'asc' },
      });
      res.json(rates);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    const parsed = rateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
      const data = parsed.data;
      let rate;
      if (data.id) {
        rate = await prisma.shippingRate.update({
          where: { id: data.id },
          data,
        });
      } else {
        rate = await prisma.shippingRate.create({ data });
      }
      res.json(rate);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
