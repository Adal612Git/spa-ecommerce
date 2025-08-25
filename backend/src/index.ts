import express from 'express';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'spa-ecommerce-backend' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
