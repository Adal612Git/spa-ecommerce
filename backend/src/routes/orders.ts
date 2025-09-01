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
          status: 'PENDING',
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

      res.json({
        orderId: order.id,
        totalCents: order.totalCents,
        zone,
        shipping_cents: shippingCents,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  });

  router.post('/create-preference', async (req, res) => {
    const logger = (req.log ?? console) as any;

    try {
      req.log?.info({ body: req.body }, 'Received create-preference body');
      logger.debug(
        `[DEBUG] Received body (type=${typeof req.body}):`,
        req.body,
      );
      logger.debug(
        `[DEBUG] req.body.items exists: ${
          req.body && Object.prototype.hasOwnProperty.call(req.body, 'items')
        }, type: ${Array.isArray(req.body?.items) ? 'array' : typeof req.body?.items}`,
      );
      logger.debug(
        `[DEBUG] req.body.preference?.items exists: ${
          req.body?.preference &&
          Object.prototype.hasOwnProperty.call(req.body.preference, 'items')
        }, type: ${
          Array.isArray(req.body?.preference?.items)
            ? 'array'
            : typeof req.body?.preference?.items
        }`,
      );

      let items: Array<{
        title: string;
        quantity: number;
        unit_price: number;
        currency_id?: string;
      }> = [];

      if (Array.isArray(req.body)) {
        items = req.body;
      } else if (Array.isArray(req.body?.items)) {
        items = req.body.items;
      } else if (Array.isArray(req.body?.preference?.items)) {
        items = req.body.preference.items;
      }

      logger.debug('[DEBUG] Normalized items:', items);

      if (!Array.isArray(items) || items.length === 0) {
        const response: Record<string, unknown> = {
          success: false,
          message: 'No items provided',
        };
        if (process.env.NODE_ENV !== 'production') {
          response.context = {
            body: req.body,
            bodyType: typeof req.body,
            itemsType: typeof req.body?.items,
            preferenceItemsType: typeof req.body?.preference?.items,
          };
        }
        return res.status(400).json(response);
      }

      const normalizedItems = items.map((item) => ({
        ...item,
        currency_id: item.currency_id ?? 'MXN',
      }));

      logger.debug(
        '[DEBUG] Items after currency normalization:',
        normalizedItems,
      );

      req.log?.info({ items: normalizedItems }, 'Items to send to MercadoPago');

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

      req.log?.info({ preference }, 'MercadoPago preference response');

      return res.json({
        success: true,
        id: preference.id,
        items: normalizedItems,
      });
    } catch (err) {
      const error = err as Error;
      const errorInfo = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
      (req.log ?? console).error(
        errorInfo,
        'Error creating MercadoPago preference',
      );
      const response: Record<string, unknown> = {
        success: false,
        message: 'Error creando preferencia',
      };
      if (process.env.NODE_ENV !== 'production') {
        response.error = errorInfo;
        response.context = {
          body: req.body,
          bodyType: typeof req.body,
          itemsType: typeof req.body?.items,
          preferenceItemsType: typeof req.body?.preference?.items,
        };
      }
      return res.status(500).json(response);
    }
  });

  return router;
}
