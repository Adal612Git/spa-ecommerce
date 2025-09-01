import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
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
  priceCents: number;
  stock: number;
}

class FakePrisma {
  products: Product[] = [
    { id: 1, priceCents: 10000, stock: 3 },
    { id: 5, priceCents: 59900, stock: 1 },
  ];

  createdOrder: any = null;
  orderToFind: any = null;
  updatedOrder: any = null;

  shippingRates = [
    { zone: 'NORTE', minWeight: 1, maxWeight: 10, priceCents: 500 },
  ];

  carts: Array<{ id: number; userId: number; items: Array<{ id: number }>; }> = [
    { id: 1, userId: 1, items: [{ id: 10 }] },
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

  cart = {
    findFirst: async ({ where }: any) =>
      this.carts.find((c) => c.userId === where.userId) || null,
  };

  cartItem = {
    deleteMany: async ({ where }: any) => {
      const cart = this.carts.find((c) => c.id === where.cartId);
      if (cart) cart.items = [];
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
  it.skip('creates an order with items and returns total', async () => {
    const res = await request(app)
      .post('/checkout/create-order')
      .send({
        items: [
          { productId: 1, quantity: 2 },
          { productId: 5, quantity: 1 },
        ],
        zone: 'NORTE',
      })
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      orderId: 123,
      status: 'PAID',
      totalCents: 80400,
    });
    expect(prisma.createdOrder.status).toBe('PAID');
    expect(prisma.createdOrder.currency).toBe('MXN');
    expect(prisma.createdOrder.totalCents).toBe(80400);
    expect(prisma.createdOrder.shipping_cents).toBe(500);
    expect(prisma.createdOrder.items.create).toEqual([
      { productId: 1, quantity: 2, unitPriceCents: 10000 },
      { productId: 5, quantity: 1, unitPriceCents: 59900 },
    ]);
  });

  it('fails when quantity exceeds stock', async () => {
    await request(app)
      .post('/checkout/create-order')
      .send({ items: [{ productId: 1, quantity: 5 }], zone: 'NORTE' })
      .expect(400);
    expect(prisma.createdOrder).toBeNull();
  });

  it('creates an order with default zone and zero shipping when rate missing', async () => {
    const res = await request(app)
      .post('/checkout/create-order')
      .send({ items: [{ productId: 1, quantity: 1 }] })
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      orderId: 123,
      status: 'PAID',
      totalCents: 10000,
      cartCleared: false,
    });
    expect(prisma.createdOrder.status).toBe('PAID');
    expect(prisma.createdOrder.shipping_cents).toBe(0);
  });

  it('returns 400 for invalid non-default zone', async () => {
    const res = await request(app)
      .post('/checkout/create-order')
      .send({ items: [{ productId: 1, quantity: 1 }], zone: 'SUR' })
      .expect(400);

    expect(res.body).toEqual({ error: 'Invalid shipping zone' });
    expect(prisma.createdOrder).toBeNull();
  });

  it('clears cart after order creation when authenticated', async () => {
    const token = jwt.sign({ sub: 1 }, process.env.JWT_SECRET || '');
    const res = await request(app)
      .post('/checkout/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: 1, quantity: 1 }] })
      .expect(200);

    expect(res.body.cartCleared).toBe(true);
    expect(prisma.carts[0].items).toHaveLength(0);
  });
});

describe('checkout create-preference', () => {
  it('accepts an array of items as the body', async () => {
    const payload = [{ title: 'Prod 1', quantity: 2, unit_price: 100 }];
    const res = await request(app)
      .post('/checkout/create-preference')
      .send(payload)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.items).toEqual([
      { title: 'Prod 1', quantity: 2, unit_price: 100, currency_id: 'MXN' },
    ]);
  });

  it('accepts an object with items array', async () => {
    const payload = { items: [{ title: 'Prod 1', quantity: 2, unit_price: 100 }] };
    const res = await request(app)
      .post('/checkout/create-preference')
      .send(payload)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.items).toEqual([
      { title: 'Prod 1', quantity: 2, unit_price: 100, currency_id: 'MXN' },
    ]);
  });
});
