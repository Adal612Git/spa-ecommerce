import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => ({ PrismaClient: class {}, Prisma: {} }));

process.env.MP_ALLOWED_IPS = '1.1.1.1';
process.env.MP_USE_MOCK = '1';
process.env.JWT_SECRET = 'testsecret';

let createApp: typeof import('../backend/src/app.js').createApp;

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn().mockImplementation(() => ({})),
  Payment: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
  })),
}));

class FakePrisma {
  products = [{ id: 1, priceCents: 1000, stock: 5 }];
  orders: any[] = [];
  events: any[] = [];
  shippingRates = [
    { zone: 'NORTE', minWeight: 1, maxWeight: 10, priceCents: 0 },
    { zone: 'default', minWeight: 1, maxWeight: 10, priceCents: 0 },
  ];

  lastShippingZone?: string;

  product = {
    findMany: async ({ where }: any) => {
      const ids: number[] = where.id.in;
      return this.products.filter((p) => ids.includes(p.id));
    },
    updateMany: async ({ where, data }: any) => {
      const prod = this.products.find((p) => p.id === where.id);
      if (!prod || prod.stock < where.stock.gte) return { count: 0 };
      prod.stock -= data.stock.decrement;
      return { count: 1 };
    },
    findUnique: async ({ where }: any) => this.products.find((p) => p.id === where.id) || null,
  };

  shippingRate = {
    findFirst: async ({ where }: any) => {
      this.lastShippingZone = where.zone;
      return this.shippingRates.find((r) => r.zone === where.zone) || null;
    },
  };

  order = {
    create: async ({ data }: any) => {
      const order = { id: this.orders.length + 1, ...data };
      this.orders.push(order);
      return order;
    },
    update: async ({ where, data, include }: any) => {
      const order = this.orders.find((o) => o.id === where.id);
      Object.assign(order, data);
      return include?.items ? { ...order, items: order.items.create } : { ...order };
    },
  };

  paymentEvent = {
    findUnique: async ({ where }: any) => this.events.find((e) => e.eventId === where.eventId) || null,
    create: async ({ data }: any) => {
      this.events.push(data);
      return data;
    },
  };

  $transaction = async (cb: any) => cb(this);
}

let prisma: FakePrisma;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  ({ createApp } = await import('../backend/src/app.js'));
});

beforeEach(() => {
  prisma = new FakePrisma();
  app = createApp(prisma as unknown as PrismaClient);
  app.set('trust proxy', 'loopback');
});

describe('orders', () => {
  it('creates order with default zone when none provided', async () => {
    await request(app)
      .post('/api/orders/create-order')
      .send({ items: [{ productId: 1, quantity: 1 }] })
      .expect(200);

    expect(prisma.orders[0]).toBeTruthy();
    expect(prisma.lastShippingZone).toBe('default');
  });

  it('creates order and confirms via webhook', async () => {
    const createRes = await request(app)
      .post('/api/orders/create-order')
      .send({ items: [{ productId: 1, quantity: 1 }], zone: 'NORTE' })
      .expect(200);
    const orderId = createRes.body.orderId;
    expect(prisma.orders[0].status).toBe('PENDING');

    await request(app)
      .post('/webhook/mercadopago')
      .set('X-Forwarded-For', '1.1.1.1')
      .send({ id: 'evt1', mp_payment_id: 'pay1', orderId, payment_status: 'approved' })
      .expect(200);

    expect(prisma.orders[0].status).toBe('CONFIRMED');
    expect(prisma.products[0].stock).toBe(4);
  });
});
