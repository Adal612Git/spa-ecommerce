import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

let createApp: typeof import('../src/app.js').createApp;

process.env.JWT_SECRET = 'testsecret';
process.env.MP_ACCESS_TOKEN = 'test';
process.env.MP_ALLOWED_IPS = '1.1.1.1';
process.env.CORS_ORIGIN = 'http://localhost:9000';

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn().mockImplementation(() => ({})),
  Payment: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue({
      external_reference: '123',
      status: 'approved',
    }),
  })),
}));

class FakePrisma {
  events: any[] = [];

  order = {
    update: vi.fn().mockResolvedValue(null),
  };

  paymentEvent = {
    findUnique: vi.fn().mockResolvedValue(null),
    create: async ({ data }: any) => {
      if (this.events.some((e) => e.mp_payment_id === data.mp_payment_id)) {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.14.0',
          meta: { target: ['mp_payment_id'] },
        });
      }
      this.events.push(data);
      return data;
    },
  };

  $transaction = async (ops: Promise<any>[]) => {
    for (const op of ops) {
      await op;
    }
  };
}

let prisma: FakePrisma;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  ({ createApp } = await import('../src/app.js'));
});

beforeEach(() => {
  prisma = new FakePrisma();
  app = createApp(prisma as unknown as PrismaClient);
  app.set('trust proxy', 'loopback');
});

describe('MercadoPago webhook', () => {
  it('ignores duplicate events on unique constraint error', async () => {
    await request(app)
      .post('/webhook/mercadopago')
      .set('X-Forwarded-For', '1.1.1.1')
      .send({ data: { id: 'pay123' } })
      .expect(200);

    const res = await request(app)
      .post('/webhook/mercadopago')
      .set('X-Forwarded-For', '1.1.1.1')
      .send({ data: { id: 'pay123' } })
      .expect(200);

    expect(res.body.status).toBe('ignored');
    expect(prisma.events).toHaveLength(1);
  });

  it('blocks requests from non-allowlisted IPs', async () => {
    await request(app)
      .post('/webhook/mercadopago')
      .set('X-Forwarded-For', '2.2.2.2')
      .send({ data: { id: 'pay321' } })
      .expect(403);
  });
});

