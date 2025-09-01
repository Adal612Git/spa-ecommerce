import express from 'express';
import { z } from 'zod';
// eslint-disable-next-line import/no-unresolved
import { MercadoPagoConfig, Preference } from 'mercadopago';
import jwt from 'jsonwebtoken';
import type { PrismaClient, User } from '@prisma/client';
import type { Counter } from 'prom-client';
// eslint-disable-next-line import/no-unresolved
import { sendMail } from '../utils/mailer.js';
// eslint-disable-next-line import/no-unresolved
import { authenticate } from '../middleware/auth.js';

const createOrderSchema = z.object({
  email: z.string().email().optional(),
  couponId: z.number().int().optional(),
  // zone is optional; if missing or empty, default to "default"
  zone: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== '' ? val : 'default')),
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
      const message = parsed.error.issues.map((i) => i.message).join(', ');
      return res.status(400).json({ error: message });
    }

    const { items, email, couponId, zone } = parsed.data;
    const authHeader = req.get('authorization');
    let userId: number | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = jwt.verify(
          token,
          process.env.JWT_SECRET || '',
        ) as jwt.JwtPayload;
        if (payload.sub) {
          userId = Number(payload.sub);
        }
      } catch {
        userId = null;
      }
    }
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
      let shippingCents = 0;
      if (!rate) {
        if (zone !== 'default') {
          return res.status(400).json({ error: 'Invalid shipping zone' });
        }
        shippingCents = 0;
      } else {
        shippingCents = rate.priceCents;
      }

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
          status: 'PAID',
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

      let cartCleared = false;
      if (userId) {
        try {
          const cart = await prisma.cart.findFirst({ where: { userId } });
          if (cart) {
            await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
            cartCleared = true;
          }
        } catch (clearErr) {
          console.error('Error clearing cart:', clearErr);
        }
      }

      res.json({
        success: true,
        orderId: order.id,
        status: order.status,
        totalCents: order.totalCents,
        cartCleared,
      });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.post('/cancel-order', async (req, res) => {
    const parsed = z
      .object({ orderId: z.number().int().positive() })
      .safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ');
      return res.status(400).json({ error: message });
    }
    const { orderId } = parsed.data;

    const authHeader = req.get('authorization');
    let userId: number | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = jwt.verify(
          token,
          process.env.JWT_SECRET || '',
        ) as jwt.JwtPayload;
        if (payload.sub) {
          userId = Number(payload.sub);
        }
      } catch {
        userId = null;
      }
    }

    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.status !== 'PAID') {
        return res
          .status(404)
          .json({ error: 'Order not found or cannot be cancelled' });
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });

      let cartCleared = false;
      if (userId) {
        try {
          const cart = await prisma.cart.findFirst({ where: { userId } });
          if (cart) {
            await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
            cartCleared = true;
          }
        } catch (clearErr) {
          console.error('Error clearing cart:', clearErr);
        }
      }

      return res.json({
        success: true,
        orderId: updated.id,
        status: updated.status,
        cartCleared,
      });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ success: false, error: message });
    }
  });

  router.post('/create-preference', async (req, res) => {
    console.log(
      '[DEBUG] Received body:',
      req.body,
      'isArray?',
      Array.isArray(req.body),
    );

    try {
      const body = Array.isArray(req.body) ? { items: req.body } : req.body;

      let items: Array<{
        title: string;
        quantity: number;
        unit_price: number;
        currency_id?: string;
      }> | undefined;

      if (Array.isArray(body?.items)) {
        items = body.items;
      } else if (Array.isArray(body?.preference?.items)) {
        items = body.preference.items;
      } else {
        return res
          .status(400)
          .json({ success: false, message: 'No items provided' });
      }

      const normalizedItems = items.map((item) => ({
        ...item,
        currency_id: item.currency_id ?? 'MXN',
      }));

      console.log('[DEBUG] Normalized items:', normalizedItems);

      const mp = new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN || '',
      });

      const preference = await new Preference(mp).create({
        body: {
          items: normalizedItems,
          back_urls: {
            success: 'http://localhost:9000/success',
            failure: 'http://localhost:9000/failure',
            pending: 'http://localhost:9000/pending',
          },
        },
      });

      return res.json({
        success: true,
        id: preference.id,
        items: normalizedItems,
      });
    } catch (err) {
      const error = err as Error;
      console.error(error);
      return res.status(500).json({
        success: false,
        message: error.message,
        stack: error.stack,
      });
    }
  });

  return router;
}
