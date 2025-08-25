import http from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line import/no-unresolved
import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3000;

const prisma = new PrismaClient();
const app = createApp(prisma);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join', (room: string) => {
    socket.join(room);
  });
});

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

export { app, prisma, io };
