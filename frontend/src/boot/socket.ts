import { boot } from 'quasar/wrappers';
import { io, type Socket } from 'socket.io-client';
import { watch } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { useProductStore } from 'src/stores/product';

let socket: Socket;
let userRoom: string | null = null;

export default boot(({ app }) => {
  const auth = useAuthStore();
  const productStore = useProductStore();

  const url = (import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:3000';
  socket = io(url, {
    autoConnect: false,
    reconnection: true,
    withCredentials: true,
  });

  socket.on('connect', () => {
    if (userRoom) {
      socket.emit('join', userRoom);
    }
  });

  socket.on('stock:updated', ({ productId, stock }) => {
    productStore.applyStockUpdate(productId, stock);
  });

  socket.on('order:statusChanged', (data) => {
    console.log('Orden confirmada', data);
  });

  watch(
    () => auth.token,
    (token) => {
      if (token) {
        socket.auth = { token };
        try {
          const payload = JSON.parse(atob(token.split('.')[1] || '')) as { sub?: string };
          if (payload.sub) {
            userRoom = `user:${payload.sub}`;
          }
        } catch (e) {
          console.error('Invalid token', e);
          userRoom = null;
        }
        socket.connect();
      } else {
        userRoom = null;
        socket.disconnect();
      }
    },
    { immediate: true }
  );

  app.config.globalProperties.$socket = socket;
});

export { socket };
