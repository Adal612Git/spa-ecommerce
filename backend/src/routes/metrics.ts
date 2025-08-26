import express from 'express';
import type { Registry } from 'prom-client';

export function createMetricsRouter(register: Registry) {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  router.post('/', (req, res) => {
    // In a real scenario, we'd persist or aggregate these metrics
    // For now, just log them for visibility
    // eslint-disable-next-line no-console
    console.log('Web Vitals metric', req.body);
    res.status(204).end();
  });

  return router;
}

