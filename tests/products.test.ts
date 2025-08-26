import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => ({ PrismaClient: class {}, ProductStatus: { ACTIVE: 'ACTIVE' } }));

process.env.JWT_SECRET = 'testsecret';

let createApp: typeof import('../backend/src/app.js').createApp;

class FakePrisma {
  products = [
    { id: 1, name: 'Prod1', slug: 'prod1', description: 'desc', priceCents: 1000, stock: 5, status: 'ACTIVE', deleted: false },
  ];

  product = {
    count: async () => this.products.length,
    findMany: async () => this.products,
  };

  $transaction = async (ops: any[]) => Promise.all(ops);
}

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  ({ createApp } = await import('../backend/src/app.js'));
});

beforeEach(() => {
  const prisma = new FakePrisma() as unknown as PrismaClient;
  app = createApp(prisma);
});

describe('products', () => {
  it('lists products and one has stock > 0', async () => {
    const res = await request(app).get('/products').expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].stock).toBeGreaterThan(0);
  });
});
