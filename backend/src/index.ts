import express from 'express';
import passport from 'passport';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';
import { createAdminRouter } from './routes/admin.js';
import { createReviewsRouter } from './routes/reviews.js';
import { createCartRouter } from './routes/cart.js';
import { createMetricsRouter } from './routes/metrics.js';
import { createOrdersRouter } from './routes/orders.js';
// eslint-disable-next-line import/no-unresolved
import { startAbandonedCartJob } from './jobs/abandonedCart.js';
import './middleware/auth.js';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(passport.initialize());

// Metrics setup
const register = new Registry();
collectDefaultMetrics({ register });

export const ordersCreatedCounter = new Counter({
  name: 'orders_created_total',
  help: 'Total number of orders created',
  registers: [register],
});

const httpErrorCounter = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP 5xx responses',
  registers: [register],
});

const httpDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'path', 'status_code'],
  registers: [register],
});

app.use((req, res, next) => {
  const end = httpDuration.startTimer({ method: req.method, path: req.path });
  res.on('finish', () => {
    end({ status_code: res.statusCode });
    if (res.statusCode >= 500) httpErrorCounter.inc();
  });
  next();
});

app.use('/api/metrics', createMetricsRouter(register));
app.use('/api/cart', createCartRouter(prisma));
app.use('/checkout', createOrdersRouter(prisma, ordersCreatedCounter));
app.use('/api/admin/reviews', createReviewsRouter(prisma));
app.use('/api/admin', createAdminRouter(prisma));

startAbandonedCartJob(prisma);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error('Unauthorized'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      sub?: string;
    };
    if (payload.sub) {
      socket.join(`user:${payload.sub}`);
    }
    return next();
  } catch (err) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', () => {
  // ready for events
});

app.set('io', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
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

