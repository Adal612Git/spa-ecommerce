import express from 'express';
import type { Registry } from 'prom-client';

export function createMetricsRouter(register: Registry) {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  return router;
}

