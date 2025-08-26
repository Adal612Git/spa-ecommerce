import express from 'express';
import { z } from 'zod';
import type { PrismaClient, User } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

export function createCartRouter(prisma: PrismaClient) {
  const router = express.Router();

  async function getOrCreateCart(userId: number) {
    let cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: true } } },
      });
    }
    return cart;
  }

  router.get('/', authenticate, async (req, res, next) => {
    try {
      const user = req.user as User;
      const cart = await getOrCreateCart(user.id);
      res.json(cart);
    } catch (err) {
      next(err);
    }
  });

  const addSchema = z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  });

  router.post('/add', authenticate, async (req, res, next) => {
    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { productId, quantity } = parsed.data;
    try {
      const user = req.user as User;
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product || product.stock < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      const cart = await getOrCreateCart(user.id);
      const existing = cart.items.find((i) => i.productId === productId);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (product.stock < newQty) {
          return res.status(400).json({ error: 'Insufficient stock' });
        }
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: newQty },
        });
      } else {
        await prisma.cartItem.create({
          data: { cartId: cart.id, productId, quantity },
        });
      }
      const updated = await getOrCreateCart(user.id);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  const updateSchema = z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  });

  router.post('/update', authenticate, async (req, res, next) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { productId, quantity } = parsed.data;
    try {
      const user = req.user as User;
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product || product.stock < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      const cart = await getOrCreateCart(user.id);
      const item = cart.items.find((i) => i.productId === productId);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity },
      });
      const updated = await getOrCreateCart(user.id);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  const removeSchema = z.object({
    productId: z.number().int().positive(),
  });

  router.post('/remove', authenticate, async (req, res, next) => {
    const parsed = removeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { productId } = parsed.data;
    try {
      const user = req.user as User;
      const cart = await getOrCreateCart(user.id);
      const item = cart.items.find((i) => i.productId === productId);
      if (item) {
        await prisma.cartItem.delete({ where: { id: item.id } });
      }
      const updated = await getOrCreateCart(user.id);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

