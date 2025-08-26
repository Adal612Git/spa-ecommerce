import express from 'express';
import passport from 'passport';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';
import fs from 'fs';
import { createStream } from 'rotating-file-stream';
import { createAdminRouter } from './routes/admin.js';
import { createReviewsRouter } from './routes/reviews.js';
import { createCartRouter } from './routes/cart.js';
import { createMetricsRouter } from './routes/metrics.js';
import { createHealthRouter } from './routes/health.js';
import { createOrdersRouter } from './routes/orders.js';
import { createAuthRouter } from './routes/auth.js';
import { createProductsRouter } from './routes/products.js';
import { createWebhookRouter } from './routes/webhook.js';
// eslint-disable-next-line import/no-unresolved
import { startAbandonedCartJob } from './jobs/abandonedCart.js';
import './middleware/auth.js';

const app = express();
const prisma = new PrismaClient();

// Logger setup (JSON structured logs)
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const fileStream = createStream('app.log', {
  size: '10M',
  interval: '1d',
  maxFiles: 7,
  path: logDir,
});

const streams = [{ stream: fileStream }];
if (process.env.NODE_ENV !== 'production') {
  streams.push({
    stream: pino.transport({
      target: 'pino-pretty',
      options: { translateTime: 'SYS:standard' },
    }),
  });
}

const logger = pino(
  {
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.token',
        'req.body.refreshToken',
        'req.body.cardNumber',
        'req.body.cvv',
      ],
      censor: '[REDACTED]',
    },
  },
  pino.multistream(streams),
);

app.use(
  pinoHttp({
    genReqId: () => randomUUID(),
    autoLogging: true,
    logger,
  }),
);

const allowedOrigins = (process.env.CORS_ORIGIN || 'https://mi-front.com')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(helmet());
app.use(helmet.hsts({ maxAge: 31_536_000, includeSubDomains: true, preload: true }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(passport.initialize());

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

const webhookLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

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

app.use('/api/health', createHealthRouter());
app.use('/api/metrics', createMetricsRouter(register));
app.use('/api/auth', authLimiter, createAuthRouter(prisma));
app.use('/api/products', createProductsRouter(prisma));
app.use('/api/cart', createCartRouter(prisma));
app.use('/checkout', createOrdersRouter(prisma, ordersCreatedCounter));
app.use('/webhook/mercadopago', webhookLimiter);
app.use('/webhook', createWebhookRouter(prisma));
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
  logger.info({ port: PORT }, 'API listening');
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;

