import express from 'express';
import { Prisma, type PrismaClient } from '@prisma/client';
// eslint-disable-next-line import/no-unresolved
import { MercadoPagoConfig, Payment } from 'mercadopago';
import type { Logger } from 'pino';
import type { Server } from 'socket.io';
import crypto from 'crypto';

interface RequestWithLog extends express.Request {
  log?: Logger;
  rawBody?: string;
}

export function createWebhookRouter(prisma: PrismaClient) {
  const router = express.Router();
  const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
  const allowedIps = (process.env.MP_ALLOWED_IPS || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);

  const allowlist = (req: RequestWithLog, res: express.Response, next: express.NextFunction) => {
    if (allowedIps.length && !allowedIps.includes(req.ip)) {
      req.log?.warn?.({ ip: req.ip }, 'MercadoPago IP not allowed');
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };

  const verifySignature = (header: string, rawBody: string, publicKey: string) => {
    const match = header.match(/t=(\d+),v1=([^,]+)/);
    if (!match) return false;
    const [, timestamp, signature] = match;
    try {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(`${timestamp}.${rawBody}`);
      verifier.end();
      return verifier.verify(publicKey, Buffer.from(signature, 'base64'));
    } catch {
      return false;
    }
  };

  router.post('/mercadopago', allowlist, async (req: RequestWithLog, res) => {
    const publicKey = process.env.MP_PUBLIC_KEY || '';
    const signature = req.get('x-meli-signature') || '';
    if (!publicKey || !verifySignature(signature, req.rawBody || '', publicKey)) {
      req.log?.warn?.('Invalid MercadoPago signature');
      return res.status(403).json({ error: 'Forbidden' });
    }

    const eventId = req.body?.id ?? req.body?.eventId;
    const mpPaymentId = req.body?.data?.id ?? req.body?.mp_payment_id;
    if (!eventId || !mpPaymentId) {
      req.log?.warn?.('event or payment id missing');
      return res.status(400).json({ error: 'event id or payment id missing' });
    }

    try {
      const exists = await prisma.paymentEvent.findUnique({
        where: { eventId: String(eventId) },
      });
      if (exists) {
        req.log?.info?.({ eventId }, 'Evento duplicado ignorado');
        return res.status(200).json({ status: 'ignored' });
      }

      let orderId: number;
      let orderStatus: string;

      if (process.env.MP_USE_MOCK === '1') {
        orderId = Number(req.body.orderId);
        if (!orderId || Number.isNaN(orderId)) {
          req.log?.error?.('orderId missing in mock request');
          return res.status(400).json({ error: 'order not found' });
        }
        const status = String(req.body.payment_status || 'approved');
        switch (status) {
          case 'approved':
            orderStatus = 'CONFIRMED';
            break;
          case 'rejected':
            orderStatus = 'REJECTED';
            break;
          default:
            orderStatus = 'PENDING';
        }
      } else {
        const payment = await new Payment(mp).get({ id: String(mpPaymentId) });
        orderId = Number(payment.external_reference);
        if (!orderId || Number.isNaN(orderId)) {
          req.log?.error?.({ mp_payment_id: mpPaymentId }, 'Order reference not found');
          return res.status(400).json({ error: 'order not found' });
        }
        switch (payment.status) {
          case 'approved':
            orderStatus = 'CONFIRMED';
            break;
          case 'rejected':
            orderStatus = 'REJECTED';
            break;
          default:
            orderStatus = 'PENDING';
        }
      }

      let userId: string | undefined;

      const updatedStocks: { productId: number; stock: number }[] = [];
      await prisma.$transaction(async (tx) => {
        interface OrderWithItems {
          items: { productId: number; quantity: number }[];
          userId?: string;
        }
        const order = (await tx.order.update({
          where: { id: orderId },
          data: { status: orderStatus },
          include: { items: true },
        })) as OrderWithItems;

        userId = order.userId;

        if (orderStatus === 'CONFIRMED') {
          for (const item of order.items) {
            const updated = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (updated.count === 0) {
              throw new Error(`Insufficient stock for product ${item.productId}`);
            }
            const prod = await tx.product.findUnique({
              where: { id: item.productId },
              select: { id: true, stock: true },
            });
            if (prod) {
              updatedStocks.push({ productId: prod.id, stock: prod.stock });
            }
          }
        }

        await tx.paymentEvent.create({
          data: {
            orderId,
            eventId: String(eventId),
            payload: req.body as unknown as Prisma.JsonValue,
          },
        });
      });

      const io: Server | undefined = req.app.get('io');
      if (io) {
        if (orderStatus === 'CONFIRMED' && userId) {
          io.to(`user:${userId}`).emit('order:statusChanged', {
            orderId,
            status: orderStatus,
          });
        }
        for (const s of updatedStocks) {
          io.emit('stock:updated', s);
        }
      }

      res.json({ ok: true });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        req.log?.info?.({ eventId }, 'Evento duplicado ignorado');
        return res.status(200).json({ status: 'ignored' });
      }
      if (err instanceof Error && err.message.startsWith('Insufficient stock')) {
        req.log?.warn?.(err.message);
        return res.status(400).json({ error: err.message });
      }
      req.log?.error?.(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
}
