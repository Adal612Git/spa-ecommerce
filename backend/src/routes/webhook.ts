import express from 'express';
import { Prisma, type PrismaClient } from '@prisma/client';
// eslint-disable-next-line import/no-unresolved
import { MercadoPagoConfig, Payment } from 'mercadopago';
import type { Logger } from 'pino';

interface RequestWithLog extends express.Request {
  log?: Logger;
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

  router.post('/mercadopago', allowlist, async (req: RequestWithLog, res) => {
    const mpPaymentId = req.body?.data?.id ?? req.body?.mp_payment_id ?? req.body?.id;
    if (!mpPaymentId) {
      req.log?.warn?.('mp_payment_id missing');
      return res.status(400).json({ error: 'mp_payment_id missing' });
    }

    try {
      const exists = await prisma.paymentEvent.findUnique({
        where: { mp_payment_id: String(mpPaymentId) },
      });
      if (exists) {
        req.log?.info?.({ mp_payment_id: mpPaymentId }, 'Evento duplicado ignorado');
        return res.status(200).json({ status: 'ignored' });
      }

      const payment = await new Payment(mp).get({ id: String(mpPaymentId) });
      const orderId = Number(payment.external_reference);
      if (!orderId || Number.isNaN(orderId)) {
        req.log?.error?.({ mp_payment_id: mpPaymentId }, 'Order reference not found');
        return res.status(400).json({ error: 'order not found' });
      }

      let orderStatus: string;
      switch (payment.status) {
        case 'approved':
          orderStatus = 'APPROVED';
          break;
        case 'rejected':
          orderStatus = 'REJECTED';
          break;
        default:
          orderStatus = 'PENDING';
      }

      await prisma.$transaction([
        prisma.order.update({ where: { id: orderId }, data: { status: orderStatus } }),
        prisma.paymentEvent.create({
          data: {
            orderId,
            mp_payment_id: String(mpPaymentId),
            status: orderStatus,
            raw_payload: req.body as unknown as Prisma.JsonValue,
          },
        }),
      ]);

      res.json({ ok: true });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        req.log?.info?.({ mp_payment_id: mpPaymentId }, 'Evento duplicado ignorado');
        return res.status(200).json({ status: 'ignored' });
      }
      req.log?.error?.(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
}
