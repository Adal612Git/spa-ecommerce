import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { PrismaClient } from '@prisma/client';

let createApp: typeof import('../src/app.js').createApp;

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn().mockImplementation(() => ({})),
  Preference: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
  })),
}));

process.env.JWT_SECRET = 'testsecret';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  stock: number;
  image_url: string | null;
  status: string;
  deleted: boolean;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function matches(where: any, p: Product) {
  if (where.id !== undefined && p.id !== where.id) return false;
  if (where.status && p.status !== where.status) return false;
  if (where.deleted !== undefined && p.deleted !== where.deleted) return false;
  if (where.slug && p.slug !== where.slug) return false;
  if (where.category && p.category !== where.category) return false;
  if (where.OR) {
    const search = where.OR[0].name?.contains || where.OR[1].description?.contains;
    const s = String(search).toLowerCase();
    if (!p.name.toLowerCase().includes(s) && !(p.description || '').toLowerCase().includes(s)) {
      return false;
    }
  }
  return true;
}

class FakePrisma {
  products: Product[] = [
    {
      id: 1,
      name: 'Alpha',
      slug: 'alpha',
      description: 'first',
      price_cents: 100,
      currency: 'MXN',
      stock: 1,
      image_url: null,
      status: 'ACTIVE',
      deleted: false,
      category: 'cat1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: 'Beta',
      slug: 'beta',
      description: 'second',
      price_cents: 200,
      currency: 'MXN',
      stock: 2,
      image_url: null,
      status: 'INACTIVE',
      deleted: false,
      category: 'cat1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      name: 'Gamma',
      slug: 'gamma',
      description: 'third',
      price_cents: 300,
      currency: 'MXN',
      stock: 3,
      image_url: null,
      status: 'ACTIVE',
      deleted: false,
      category: 'cat2',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  product = {
    count: async ({ where }: any) => this.products.filter((p) => matches(where, p)).length,
    findMany: async ({ where, orderBy, skip, take }: any) => {
      return this.products
        .filter((p) => matches(where, p))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(skip, skip + take);
    },
    findFirst: async ({ where }: any) => this.products.find((p) => matches(where, p)) || null,
  };

  $transaction = async <T>(queries: Promise<T>[]) => Promise.all(queries);
}

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  ({ createApp } = await import('../src/app.js'));
});

beforeEach(() => {
  const prisma = new FakePrisma() as unknown as PrismaClient;
  app = createApp(prisma);
});

describe('products endpoints', () => {
  it('lists active products', async () => {
    const res = await request(app).get('/products').expect(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data[0].name).toBe('Alpha');
  });

  it('filters products by category', async () => {
    const res = await request(app).get('/products?category=cat1').expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe('alpha');
  });

  it('gets a product by id', async () => {
    const res = await request(app).get('/products/1').expect(200);
    expect(res.body.slug).toBe('alpha');
    await request(app).get('/products/2').expect(404);
  });
});
