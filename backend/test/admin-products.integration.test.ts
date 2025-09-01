import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';

vi.mock('../src/utils/s3.js', () => ({ uploadImage: vi.fn().mockResolvedValue('url') }));
vi.mock('../src/utils/gcs.js', () => ({ uploadImage: vi.fn().mockResolvedValue('url') }));

process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRES_IN = '7d';

let createApp: typeof import('../src/app.js').createApp;

const adminHash = bcrypt.hashSync('admin1234', 1);

class FakePrisma {
  products: any[] = [];

  user = {
    findUnique: async ({ where: { email, id } }: any) => {
      if (email) return { id: '1', email, passwordHash: adminHash, role: 'ADMIN' };
      if (id) return { id, email: 'admin@example.com', passwordHash: adminHash, role: 'ADMIN' };
      return null;
    },
  };

  product = {
    create: async ({ data }: any) => {
      const prod = { id: this.products.length + 1, ...data };
      this.products.push(prod);
      return prod;
    },
    update: async () => ({}),
  };

  productImage = {
    createMany: async () => ({}),
  };
}

let app: express.Express;

beforeAll(async () => {
  ({ createApp } = await import('../src/app.js'));
});

beforeEach(() => {
  const prisma = new FakePrisma() as unknown as PrismaClient;
  const base = createApp(prisma);
  const api = express();
  api.use('/api', base);
  app = api;
});

describe('admin products upload', () => {
  it('rejects JSON payload', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin1234' })
      .expect(200);
    const token = login.body.token;
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test', priceCents: '100', stock: '1', category: 'cat', status: 'ACTIVE' });
    expect([400, 415]).toContain(res.status);
  });

  it('accepts form-data without images', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin1234' })
      .expect(200);
    const token = login.body.token;
    await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Test')
      .field('priceCents', '100')
      .field('stock', '1')
      .field('category', 'cat')
      .field('status', 'ACTIVE')
      .expect(201);
  });

  it('accepts form-data with images', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin1234' })
      .expect(200);
    const token = login.body.token;
    await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Test')
      .field('priceCents', '100')
      .field('stock', '1')
      .field('category', 'cat')
      .field('status', 'ACTIVE')
      .attach('images', Buffer.from('hello'), 'test.png')
      .expect(201);
  });
});
