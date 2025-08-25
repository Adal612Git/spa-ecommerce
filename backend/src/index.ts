import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line import/no-unresolved
import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3000;

const prisma = new PrismaClient();
const app = createApp(prisma);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

export { app, prisma };
