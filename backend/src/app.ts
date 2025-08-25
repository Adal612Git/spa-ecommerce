import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import type { Options } from 'pino-http';
import type { Logger } from 'pino';
import { randomUUID } from 'crypto';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import type { PrismaClient } from '@prisma/client';
// eslint-disable-next-line import/no-unresolved
import { createAuthRouter } from './routes/auth.js';

interface RequestWithLog extends express.Request {
  log?: Logger;
}

export function createApp(prisma: PrismaClient) {
  const app = express();
  const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
  const JWT_SECRET = process.env.JWT_SECRET ?? '';

  app.use(helmet());
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(rateLimit({ windowMs: 60_000, limit: 100 }));

  app.use(
    (pinoHttp as unknown as (opts?: Options) => express.RequestHandler)({
      genReqId: () => randomUUID(),
      autoLogging: true,
      transport:
        process.env.NODE_ENV === 'production'
          ? undefined
          : { target: 'pino-pretty', options: { translateTime: 'SYS:standard' } },
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

  app.use('/auth', createAuthRouter(prisma));

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
        res.status(400).json({ ok: false, error: 'Bad Request' });
        return;
      }
      res.status(500).json({ ok: false, error: 'Internal Server Error' });
    },
  );

  return app;
}
