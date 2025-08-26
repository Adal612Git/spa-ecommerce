import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => ({ PrismaClient: class {} }));

process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRES_IN = '7d';

let createApp: typeof import('../backend/src/app.js').createApp;

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
        role: 'CUSTOMER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.push(user);
      if (select) {
        const { passwordHash, updatedAt, ...rest } = user;
        return rest;
      }
      return user;
    },
  };
}

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  ({ createApp } = await import('../backend/src/app.js'));
});

beforeEach(() => {
  const prisma = new FakePrisma() as unknown as PrismaClient;
  app = createApp(prisma);
});

describe('auth', () => {
  it('registers and logs in a user', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);
    expect(res.body.token).toBeTruthy();
  });
});
