import express from 'express';
import { Prisma, type PrismaClient, ProductStatus } from '@prisma/client';

export function createProductsRouter(prisma: PrismaClient) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    const page = Number.parseInt(req.query.page as string, 10) || 1;
    const limit = Number.parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || '';
    const categoryParam = req.query.category;

    try {
      const where: Prisma.ProductWhereInput = {
        deleted: false,
        status: ProductStatus.ACTIVE,
      };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (categoryParam) {
        if (Array.isArray(categoryParam)) {
          return res.status(400).json({ error: 'Invalid category' });
        }
        where.category = categoryParam;
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
      const product = await prisma.product.findFirst({
        where: { slug, deleted: false, status: ProductStatus.ACTIVE },
        include: { images: true },
      });
      if (!product) {
        return res.status(404).json({ error: 'Not Found' });
      }
      res.json(product);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:slug/meta', async (req, res, next) => {
    const { slug } = req.params;
    try {
      const product = await prisma.product.findFirst({
        where: { slug, deleted: false, status: ProductStatus.ACTIVE },
        include: { images: { select: { url: true }, take: 1 } },
      });
      if (!product) {
        return res.status(404).json({ error: 'Not Found' });
      }
      res.json({
        title: product.name,
        description: product.description,
        image: product.images[0]?.url ?? '',
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
