import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { PrismaClient } from '@prisma/client';

let createApp: typeof import('../src/app.js').createApp;

process.env.JWT_SECRET = 'testsecret';
process.env.MP_ACCESS_TOKEN = 'test';
process.env.CORS_ORIGIN = 'http://localhost:9000';

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn().mockImplementation(() => ({})),
  Preference: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({
      id: 'pref123',
      init_point: 'http://mp/init',
    }),
  })),
}));

interface Product {
  id: number;
  price_cents: number;
  stock: number;
}

class FakePrisma {
  products: Product[] = [
    { id: 1, price_cents: 10000, stock: 3 },
    { id: 5, price_cents: 59900, stock: 1 },
  ];

  createdOrder: any = null;
  orderToFind: any = null;
  updatedOrder: any = null;

  shippingRates = [
    { zone: 'NORTE', minWeight: 1, maxWeight: 10, priceCents: 500 },
  ];

  product = {
    findMany: async ({ where }: any) => {
      const ids: number[] = where.id.in;
      return this.products.filter((p) => ids.includes(p.id));
    },
  };

  shippingRate = {
    findFirst: async ({ where }: any) => {
      const weight = where.minWeight.lte;
      return (
        this.shippingRates.find(
          (r) => r.zone === where.zone && r.minWeight <= weight && r.maxWeight >= weight,
        ) || null
      );
    },
  };

  order = {
    create: async ({ data }: any) => {
      this.createdOrder = data;
      return { id: 123, ...data };
    },
    findUnique: async ({ where }: any) => {
      if (this.orderToFind && where.id === this.orderToFind.id) {
        return this.orderToFind;
      }
      return null;
    },
    update: async ({ where, data }: any) => {
      this.updatedOrder = { where, data };
      return { id: where.id, ...data };
    },
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
});

describe('checkout create-order', () => {
  it('creates an order with items and returns total', async () => {
    const res = await request(app)
      .post('/checkout/create-order')
      .send({
        items: [{ productId: 1, qty: 2 }, { productId: 5, qty: 1 }],
        zone: 'NORTE',
      })
      .expect(200);

    expect(res.body.total_cents).toBe(80400);
    expect(prisma.createdOrder.status).toBe('PENDING');
    expect(prisma.createdOrder.currency).toBe('MXN');
    expect(prisma.createdOrder.total_cents).toBe(80400);
    expect(prisma.createdOrder.shipping_cents).toBe(500);
    expect(prisma.createdOrder.items.create).toEqual([
      { productId: 1, qty: 2, unit_price_cents: 10000 },
      { productId: 5, qty: 1, unit_price_cents: 59900 },
    ]);
  });

  it('fails when qty exceeds stock', async () => {
    await request(app)
      .post('/checkout/create-order')
      .send({ items: [{ productId: 1, qty: 5 }], zone: 'NORTE' })
      .expect(400);
    expect(prisma.createdOrder).toBeNull();
  });
});

describe('checkout create-preference', () => {
  it('creates a MercadoPago preference and stores id', async () => {
    prisma.orderToFind = {
      id: 123,
      items: [
        {
          qty: 2,
          unit_price_cents: 10000,
          product: { name: 'Prod 1' },
        },
      ],
    };

    const res = await request(app)
      .post('/checkout/create-preference')
      .send({ orderId: 123 })
      .expect(200);

    expect(res.body.init_point).toBe('http://mp/init');
    expect(prisma.updatedOrder?.data.mp_preference_id).toBe('pref123');
  });
});
