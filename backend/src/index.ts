import express from 'express';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import { createAdminRouter } from './routes/admin.js';
import { createReviewsRouter } from './routes/reviews.js';
// eslint-disable-next-line import/no-unresolved
import { startAbandonedCartJob } from './jobs/abandonedCart.js';
import './middleware/auth.js';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(passport.initialize());

app.use('/api/admin/reviews', createReviewsRouter(prisma));
app.use('/api/admin', createAdminRouter(prisma));

startAbandonedCartJob(prisma);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
