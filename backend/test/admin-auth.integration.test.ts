import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn().mockImplementation(() => ({})),
  Preference: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({ id: 'pref123', init_point: 'http://mp/init' }),
  })),
}));

process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRES_IN = '7d';

let createApp: typeof import('../src/app.js').createApp;

const admin1Hash = bcrypt.hashSync('admin1234', 1);
const admin2Hash = bcrypt.hashSync('admin12345', 1);

class FakePrisma {
  users = [
    { id: '1', email: 'admin@example.com', passwordHash: admin1Hash, role: 'ADMIN' },
    { id: '2', email: 'admin2@example.com', passwordHash: admin2Hash, role: 'ADMIN' },
  ];

  user = {
    findUnique: async ({ where: { email, id } }: any) => {
      if (email) return this.users.find((u) => u.email === email) || null;
      if (id) return this.users.find((u) => u.id === id) || null;
      return null;
    },
  };

  product = {
    findMany: async () => [],
  };
}

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  ({ createApp } = await import('../src/app.js'));
});

beforeEach(() => {
  const prisma = new FakePrisma() as unknown as PrismaClient;
  app = createApp(prisma);
});

describe('admin auth', () => {
  it('allows seeded admins to login and access protected routes', async () => {
    const login1 = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'admin1234' })
      .expect(200);
    expect(login1.body.token).toBeTruthy();

    const login2 = await request(app)
      .post('/auth/login')
      .send({ email: 'admin2@example.com', password: 'admin12345' })
      .expect(200);
    expect(login2.body.token).toBeTruthy();

    await request(app)
      .get('/admin/products')
      .set('Authorization', `Bearer ${login1.body.token}`)
      .expect(200);

    await request(app).get('/admin/products').expect(401);
  });
});

