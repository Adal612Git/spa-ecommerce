import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { PrismaClient } from '@prisma/client';

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn().mockImplementation(() => ({})),
  Preference: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
  })),
}));

process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRES_IN = '7d';

let createApp: typeof import('../src/app.js').createApp;

class FakePrisma {
  users: any[] = [];

  user = {
    findUnique: async ({ where: { email, id } }: any) => {
      if (email) return this.users.find((u) => u.email === email) || null;
      if (id) return this.users.find((u) => u.id === id) || null;
      return null;
    },
    create: async ({ data, select }: any) => {
      const user = {
        ...data,
        id: String(this.users.length + 1),
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.push(user);
      if (select) {
        const { passwordHash, updatedAt, ...selected } = user;
        return selected;
      }
      return user;
    },
    findMany: async () =>
      this.users.map(({ passwordHash, updatedAt, ...u }) => u),
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

describe('auth flow', () => {
  it('registers, logs in and gets profile', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201);

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);
    const token = loginRes.body.token;
    expect(token).toBeTruthy();

    const meRes = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(meRes.body.email).toBe('test@example.com');
  });
});
