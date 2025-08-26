import express from 'express';
import multer from 'multer';
import { PrismaClient, OrderStatus } from '@prisma/client';
import type { Server } from 'socket.io';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { uploadImage as uploadS3 } from '../utils/s3.js';
import { uploadImage as uploadGCS } from '../utils/gcs.js';

const uploadImage = (
  filePath: string,
  fileName: string,
): Promise<string> => {
  return process.env.STORAGE_PROVIDER === 'gcs'
    ? uploadGCS(filePath, fileName)
    : uploadS3(filePath, fileName);
};

const upload = multer({ dest: 'uploads/' });

export function createAdminRouter(prisma: PrismaClient) {
  const router = express.Router();

  // Products
  router.get(
    '/products',
    authenticate,
    requireRole('ADMIN', 'MODERATOR'),
    async (_req, res) => {
      const products = await prisma.product.findMany({
        where: { deleted: false },
        include: { images: true },
      });
      res.json(products);
    }
  );

  router.post(
    '/products',
    authenticate,
    requireRole('ADMIN', 'MODERATOR'),
    upload.array('images'),
    async (req, res) => {
      const { name, description, priceCents, category, status, stock } = req.body;
      if (Number(priceCents) < 0 || Number(stock) < 0) {
        return res.status(400).json({ message: 'Invalid price or stock' });
      }
      const product = await prisma.product.create({
        data: {
          name,
          description,
          priceCents: Number(priceCents),
          category,
          status,
          stock: Number(stock),
        },
      });
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        const uploaded = await Promise.all(
          files.map(async (f) => ({ url: await uploadImage(f.path, f.originalname) }))
        );
        await prisma.product.update({
          where: { id: product.id },
          data: { images: { createMany: { data: uploaded } } },
        });
      }
      res.status(201).json(product);
    }
  );

  router.put(
    '/products/:id',
    authenticate,
    requireRole('ADMIN', 'MODERATOR'),
    upload.array('images'),
    async (req, res) => {
      const { id } = req.params;
      const { name, description, priceCents, category, status, stock } = req.body;
      if (Number(priceCents) < 0 || Number(stock) < 0) {
        return res.status(400).json({ message: 'Invalid price or stock' });
      }
      await prisma.product.update({
        where: { id: Number(id) },
        data: {
          name,
          description,
          priceCents: Number(priceCents),
          category,
          status,
          stock: Number(stock),
        },
      });
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        const uploaded = await Promise.all(
          files.map(async (f) => ({ url: await uploadImage(f.path, f.originalname) }))
        );
        await prisma.productImage.createMany({
          data: uploaded.map((img) => ({ ...img, productId: Number(id) })),
        });
      }
      res.json({ message: 'Updated' });
    }
  );

  router.delete(
    '/products/:id',
    authenticate,
    requireRole('ADMIN', 'MODERATOR'),
    async (req, res) => {
      await prisma.product.update({
        where: { id: Number(req.params.id) },
        data: { deleted: true },
      });
      res.json({ message: 'Deleted' });
    }
  );

  router.patch(
    '/products/:id/stock',
    authenticate,
    requireRole('ADMIN', 'MODERATOR'),
    async (req, res) => {
      const { stock } = req.body;
      if (Number(stock) < 0) {
        return res.status(400).json({ message: 'Stock cannot be negative' });
      }
      const product = await prisma.product.update({
        where: { id: Number(req.params.id) },
        data: { stock: Number(stock) },
      });
      const io: Server | undefined = req.app.get('io');
      io?.emit('stock:updated', { productId: product.id, stock: product.stock });
      res.json(product);
    }
  );

  // Orders
  router.get(
    '/orders',
    authenticate,
    requireRole('ADMIN', 'MODERATOR'),
    async (req, res) => {
      const { status } = req.query;
      const orders = await prisma.order.findMany({
        where: status ? { status: status as OrderStatus } : {},
        include: { items: true, user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json(orders);
    }
  );

  router.patch(
    '/orders/:id/status',
    authenticate,
    requireRole('ADMIN', 'MODERATOR'),
    async (req, res) => {
      const { status } = req.body;
      const order = await prisma.order.update({
        where: { id: Number(req.params.id) },
        data: { status },
      });
      res.json(order);
    }
  );

  return router;
}
