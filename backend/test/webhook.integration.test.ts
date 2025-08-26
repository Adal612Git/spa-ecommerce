import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

let createApp: typeof import('../src/app.js').createApp;
let privateKey: string;

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
    update: vi.fn().mockResolvedValue({ items: [], userId: 'u1' }),
  };

  paymentEvent = {
    findUnique: vi.fn().mockResolvedValue(null),
    create: async ({ data }: any) => {
      if (this.events.some((e) => e.eventId === data.eventId)) {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.14.0',
          meta: { target: ['eventId'] },
        });
      }
      this.events.push(data);
      return data;
    },
  };

  $transaction = async (arg: any) => {
    if (typeof arg === 'function') {
      await arg(this);
      return;
    }
    for (const op of arg) {
      await op;
    }
  };
}

let prisma: FakePrisma;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  ({ createApp } = await import('../src/app.js'));
  const { privateKey: pk, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  privateKey = pk.export({ type: 'pkcs1', format: 'pem' }).toString();
  process.env.MP_PUBLIC_KEY = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString();
});

beforeEach(() => {
  prisma = new FakePrisma();
  app = createApp(prisma as unknown as PrismaClient);
  app.set('trust proxy', 'loopback');
});

function signPayload(payload: any) {
  const raw = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(`${timestamp}.${raw}`)
    .end()
    .sign(privateKey, 'base64');
  return { raw, header: `t=${timestamp},v1=${signature}` };
}

describe('MercadoPago webhook', () => {
  it('ignores duplicate events on unique constraint error', async () => {
    const payload = { id: 'evt1', data: { id: 'pay123' } };
    let signed = signPayload(payload);
    await request(app)
      .post('/webhook/mercadopago')
      .set('X-Forwarded-For', '1.1.1.1')
      .set('x-meli-signature', signed.header)
      .set('Content-Type', 'application/json')
      .send(signed.raw)
      .expect(200);

    signed = signPayload(payload);
    const res = await request(app)
      .post('/webhook/mercadopago')
      .set('X-Forwarded-For', '1.1.1.1')
      .set('x-meli-signature', signed.header)
      .set('Content-Type', 'application/json')
      .send(signed.raw)
      .expect(200);

    expect(res.body.status).toBe('ignored');
    expect(prisma.events).toHaveLength(1);
  });

  it('blocks requests from non-allowlisted IPs', async () => {
    const payload = { id: 'evt2', data: { id: 'pay321' } };
    const signed = signPayload(payload);
    await request(app)
      .post('/webhook/mercadopago')
      .set('X-Forwarded-For', '2.2.2.2')
      .set('x-meli-signature', signed.header)
      .set('Content-Type', 'application/json')
      .send(signed.raw)
      .expect(403);
  });

  it('rejects requests with invalid signature', async () => {
    const payload = { id: 'evt3', data: { id: 'pay000' } };
    const raw = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    await request(app)
      .post('/webhook/mercadopago')
      .set('X-Forwarded-For', '1.1.1.1')
      .set('x-meli-signature', `t=${timestamp},v1=invalid`)
      .set('Content-Type', 'application/json')
      .send(raw)
      .expect(403);
  });
});

