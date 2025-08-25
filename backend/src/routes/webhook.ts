import express from 'express';
import type { PrismaClient, Prisma } from '@prisma/client';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import type { Logger } from 'pino';

interface RequestWithLog extends express.Request {
  log?: Logger;
}

export function createWebhookRouter(prisma: PrismaClient) {
  const router = express.Router();
  const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

  router.post('/mercadopago', async (req: RequestWithLog, res) => {
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
        req.log?.info?.({ mp_payment_id: mpPaymentId }, 'Payment already processed');
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
      req.log?.error?.(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
}
