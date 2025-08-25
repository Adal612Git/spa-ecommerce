import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { PrismaClient } from '@prisma/client';

let createApp: typeof import('../src/app.js').createApp;

process.env.JWT_SECRET = 'testsecret';

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

  product = {
    findMany: async ({ where }: any) => {
      const ids: number[] = where.id.in;
      return this.products.filter((p) => ids.includes(p.id));
    },
  };

  order = {
    create: async ({ data }: any) => {
      this.createdOrder = data;
      return { id: 123, ...data };
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
      .send({ items: [{ productId: 1, qty: 2 }, { productId: 5, qty: 1 }] })
      .expect(200);

    expect(res.body.total_cents).toBe(79900);
    expect(prisma.createdOrder.status).toBe('PENDING');
    expect(prisma.createdOrder.currency).toBe('MXN');
    expect(prisma.createdOrder.total_cents).toBe(79900);
    expect(prisma.createdOrder.items.create).toEqual([
      { productId: 1, qty: 2, unit_price_cents: 10000 },
      { productId: 5, qty: 1, unit_price_cents: 59900 },
    ]);
  });

  it('fails when qty exceeds stock', async () => {
    await request(app)
      .post('/checkout/create-order')
      .send({ items: [{ productId: 1, qty: 5 }] })
      .expect(400);
    expect(prisma.createdOrder).toBeNull();
  });
});
