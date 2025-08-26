import express from 'express';

// Health endpoint used for availability monitoring (target SLA >=99%)
export function createHealthRouter() {
  const router = express.Router();

  router.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
    });
  });

  return router;
}
