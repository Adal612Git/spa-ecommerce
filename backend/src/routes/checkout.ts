import express from 'express';
import { z } from 'zod';
// eslint-disable-next-line import/no-unresolved
import { MercadoPagoConfig, Preference } from 'mercadopago';
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

  router.post('/create-preference', async (req, res, next) => {
    const schema = z.object({ orderId: z.number().int().positive() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { orderId } = parsed.data;

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
      });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const mp = new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN || '',
      });
      const preference = await new Preference(mp).create({
        items: order.items.map((item) => ({
          title: item.product.name,
          quantity: item.qty,
          unit_price: item.unit_price_cents / 100,
          currency_id: 'MXN',
        })),
        back_urls: {
          success: `${process.env.CORS_ORIGIN}/checkout/success`,
          failure: `${process.env.CORS_ORIGIN}/checkout/failure`,
          pending: `${process.env.CORS_ORIGIN}/checkout/pending`,
        },
        auto_return: 'approved',
        external_reference: orderId.toString(),
      });

      await prisma.order.update({
        where: { id: orderId },
        data: { mp_preference_id: preference.id },
      });

      res.json({ init_point: preference.init_point });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
