import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import pino, { type Logger } from 'pino';
import { createStream } from 'rotating-file-stream';
import fs from 'fs';
import type { Options } from 'pino-http';
import { randomUUID } from 'crypto';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import type { PrismaClient } from '@prisma/client';
// eslint-disable-next-line import/no-unresolved
import { createAuthRouter } from './routes/auth.js';
// eslint-disable-next-line import/no-unresolved
import { createProductsRouter } from './routes/products.js';
// eslint-disable-next-line import/no-unresolved
import { createOrdersRouter } from './routes/orders.js';
// eslint-disable-next-line import/no-unresolved
import { createWebhookRouter } from './routes/webhook.js';
// eslint-disable-next-line import/no-unresolved
import { createAdminRouter } from './routes/admin.js';
// eslint-disable-next-line import/no-unresolved
import { createReviewsRouter } from './routes/reviews.js';
// eslint-disable-next-line import/no-unresolved
import { createCouponsRouter } from './routes/coupons.js';
// eslint-disable-next-line import/no-unresolved
import { createShippingRouter } from './routes/shipping.js';

interface RequestWithLog extends express.Request {
  log?: Logger;
}

export function createApp(prisma: PrismaClient) {
  const app = express();
  const allowedOrigins = (process.env.CORS_ORIGIN || 'https://mi-front.com')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const JWT_SECRET = process.env.JWT_SECRET ?? '';

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
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: string }).rawBody = buf.toString();
      },
    }),
  );

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
    (pinoHttp as unknown as (opts?: Options) => express.RequestHandler)({
      genReqId: () => randomUUID(),
      autoLogging: true,
      logger,
    }),
  );

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: payload.sub as string },
          });
          if (!user) return done(null, false);
          return done(null, user);
        } catch (err) {
          return done(err as Error, false);
        }
      },
    ),
  );
  app.use(passport.initialize());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'spa-ecommerce-backend' });
  });

  app.use('/auth', authLimiter, createAuthRouter(prisma));
  app.use('/products', createProductsRouter(prisma));
  app.use('/api/orders', createOrdersRouter(prisma));
  app.use('/checkout', createOrdersRouter(prisma));
  app.use('/webhook/mercadopago', webhookLimiter);
  app.use('/webhook', createWebhookRouter(prisma));
  app.use('/admin/reviews', createReviewsRouter(prisma));
  app.use('/admin', createAdminRouter(prisma));
  app.use('/api/coupons', createCouponsRouter(prisma));
  app.use('/api/shipping', createShippingRouter(prisma));

  app.get('/api/users', async (req, res, next) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
      res.json(users);
    } catch (err) {
      (req as RequestWithLog).log?.error?.(err);
      next(err);
    }
  });

  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
    ) => {
      (req as RequestWithLog).log?.error?.(err);
      if (err instanceof Error && 'flatten' in err) {
        res.status(400).json({ error: 'Bad Request' });
        return;
      }
      res.status(500).json({ error: 'Internal Server Error' });
    },
  );

  return app;
}
