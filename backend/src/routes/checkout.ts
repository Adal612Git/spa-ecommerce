import express from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        qty: z.number().int().positive(),
      })
    )
    .min(1),
});

export function createCheckoutRouter(prisma: PrismaClient) {
  const router = express.Router();

  router.post('/create-order', async (req, res, next) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { items } = parsed.data;
    try {
      const ids = items.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
      });
      if (products.length !== ids.length) {
        return res.status(400).json({ error: 'Invalid product' });
      }

      const productMap = new Map(products.map((p) => [p.id, p]));
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product || item.qty > product.stock) {
          return res.status(400).json({ error: 'Insufficient stock' });
        }
      }

      const total = items.reduce((sum, item) => {
        const product = productMap.get(item.productId)!;
        return sum + item.qty * product.price_cents;
      }, 0);

      const order = await prisma.order.create({
        data: {
          status: 'PENDING',
          currency: 'MXN',
          total_cents: total,
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                qty: item.qty,
                unit_price_cents: product.price_cents,
              };
            }),
          },
        },
      });

      res.json({ orderId: order.id, total_cents: order.total_cents });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
