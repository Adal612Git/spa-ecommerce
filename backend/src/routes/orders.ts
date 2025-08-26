import express from 'express';
import { z } from 'zod';
// eslint-disable-next-line import/no-unresolved
import { MercadoPagoConfig, Preference } from 'mercadopago';
import type { PrismaClient, User } from '@prisma/client';
import type { Counter } from 'prom-client';
// eslint-disable-next-line import/no-unresolved
import { sendMail } from '../utils/mailer.js';
// eslint-disable-next-line import/no-unresolved
import { authenticate } from '../middleware/auth.js';

const createOrderSchema = z.object({
  email: z.string().email().optional(),
  couponId: z.number().int().optional(),
  zone: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export function createOrdersRouter(
  prisma: PrismaClient,
  orderCounter?: Counter,
) {
  const router = express.Router();

  router.get('/', authenticate, async (req, res, next) => {
    try {
      const user = req.user as User;
      const orders = await prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } },
      });
      res.json(orders);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', authenticate, async (req, res, next) => {
    try {
      const user = req.user as User;
      const id = Number(req.params.id);
      const order = await prisma.order.findFirst({
        where: { id, userId: user.id },
        include: { items: { include: { product: true } } },
      });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (err) {
      next(err);
    }
  });

  router.post('/create-order', async (req, res, next) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { items, email, couponId, zone } = parsed.data;
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
        if (!product || item.quantity > product.stock) {
          return res.status(400).json({ error: 'Insufficient stock' });
        }
      }

      const total = items.reduce((sum, item) => {
        const product = productMap.get(item.productId)!;
        return sum + item.quantity * product.priceCents;
      }, 0);

      const weight = items.reduce((sum, item) => sum + item.quantity, 0);
      const rate = await prisma.shippingRate.findFirst({
        where: {
          zone,
          minWeight: { lte: weight },
          maxWeight: { gte: weight },
        },
      });
      if (!rate) {
        return res.status(400).json({ error: 'Invalid shipping zone' });
      }
      const shippingCents = rate.priceCents;

      let discount = 0;
      if (couponId) {
        const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
        if (coupon && coupon.usedCount < coupon.usageLimit && coupon.expiresAt > new Date()) {
          discount = coupon.type === 'PERCENTAGE' ? Math.floor((total * coupon.value) / 100) : coupon.value;
          if (discount > total) discount = total;
        }
      }

      const order = await prisma.order.create({
        data: {
          status: 'PENDING',
          currency: 'MXN',
          totalCents: total - discount + shippingCents,
          shipping_cents: shippingCents,
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPriceCents: product.priceCents,
              };
            }),
          },
        },
      });
      orderCounter?.inc();

      if (couponId) {
        await prisma.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      if (email) {
        await sendMail({
          to: email,
          subject: 'Pedido confirmado',
          text: `Tu pedido #${order.id} ha sido creado. Total: ${(order.totalCents / 100).toFixed(2)} MXN`,
        });
      }

      res.json({ orderId: order.id, totalCents: order.totalCents });
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
          quantity: item.quantity,
          unit_price: item.unitPriceCents / 100,
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
