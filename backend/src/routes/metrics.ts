import express from 'express';
import type { Registry } from 'prom-client';
import type { Logger } from 'pino';

interface RequestWithLog extends express.Request {
  log?: Logger;
}

export function createMetricsRouter(register: Registry) {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  router.post('/', (req: RequestWithLog, res) => {
    // In a real scenario, we'd persist or aggregate these metrics
    // For now, just log them for visibility in structured form
    req.log?.info({ metric: req.body }, 'web-vitals');
    res.status(204).end();
  });

  return router;
}

