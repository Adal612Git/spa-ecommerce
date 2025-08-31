import { boot } from 'quasar/wrappers';
import { io, type Socket } from 'socket.io-client';

export default boot(({ app }) => {
  const socket: Socket = io(
    import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000',
    {
      transports: ['websocket'],
      withCredentials: true,
    },
  );

  app.config.globalProperties.$socket = socket;
});

export type { Socket };

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $socket: Socket;
  }
}
