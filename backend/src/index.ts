import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import type { Options } from 'pino-http';
import type { Logger } from 'pino';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

interface RequestWithLog extends express.Request {
  log?: Logger;
}

const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT) || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

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

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'spa-ecommerce-backend' });
});

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    (req as RequestWithLog).log?.error?.(err);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  },
);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
