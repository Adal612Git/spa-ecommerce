import express from 'express';
import type { Prisma, PrismaClient } from '@prisma/client';

export function createProductsRouter(prisma: PrismaClient) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    const page = Number.parseInt(req.query.page as string, 10) || 1;
    const limit = Number.parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || '';

    try {
      const where: Prisma.ProductWhereInput = { is_active: true };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, products] = await prisma.$transaction([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          orderBy: { name: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      res.json({ data: products, meta: { page, limit, total } });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:slug', async (req, res, next) => {
    const { slug } = req.params;
    try {
      const product = await prisma.product.findFirst({ where: { slug, is_active: true } });
      if (!product) {
        return res.status(404).json({ error: 'Not Found' });
      }
      res.json(product);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
