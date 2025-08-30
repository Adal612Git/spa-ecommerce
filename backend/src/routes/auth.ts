import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { z } from 'zod';
// eslint-disable-next-line import/no-unresolved
import { hashPassword } from '../utils/password.js';
import type { PrismaClient, User } from '@prisma/client';
// eslint-disable-next-line import/no-unresolved
import { revokedTokens, setPrismaClient } from '../middleware/auth.js';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(), // 👈 ahora acepta name opcional
});
export const loginSchema = registerSchema.omit({ name: true });

const JWT_SECRET = process.env.JWT_SECRET ?? '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function createAuthRouter(prisma: PrismaClient) {
  const router = express.Router();
  setPrismaClient(prisma);

  // POST /api/auth/register
  router.post('/register', async (req, res, next) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.flatten() });
    }
    const { email, password, name } = parsed.data;
    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ ok: false, error: 'Email already in use' });
      }
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: { email, passwordHash, name }, // 👈 guardamos name si viene
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/auth/login
  router.post('/login', (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.flatten() });
    }
    req.body = parsed.data;
    passport.authenticate('local', { session: false }, (err, user) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ ok: false, error: 'Invalid credentials' });
      }
      const token = jwt.sign({ sub: (user as User).id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });
      res.json({ token });
    })(req, res, next);
  });

  // POST /api/auth/logout
  router.post('/logout', passport.authenticate('jwt', { session: false }), (req, res) => {
    const token = req.get('authorization')?.replace('Bearer ', '');
    if (token) {
      revokedTokens.add(token);
    }
    res.json({ ok: true });
  });

  // GET /api/auth/me
  router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
    const user = req.user as User | undefined;
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...data } = user;
    res.json(data);
  });

  return router;
}
