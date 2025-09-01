import { defineStore } from 'pinia';
import { api } from 'src/api/api';
import { useAuthStore } from './auth';
import type { Order } from 'src/types/order';
import { Notify } from 'quasar';

export const useOrdersStore = defineStore('adminOrders', {
  state: () => ({ orders: [] as Order[] }),
  actions: {
    async fetch(status?: string) {
      const auth = useAuthStore();
      try {
        const { data } = await api.get('/api/admin/orders', {
          params: { status },
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        this.orders = data;
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        const status = e.response?.status;
        Notify.create({
          type: 'negative',
          message:
            status === 401 || status === 403
              ? 'No autorizado, inicia sesión como admin'
              : 'Error inesperado, inténtalo de nuevo',
        });
      }
    },
    async updateStatus(id: number, status: string) {
      const auth = useAuthStore();
      try {
        await api.patch(
          `/api/admin/orders/${id}/status`,
          { status },
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        Notify.create({ type: 'positive', message: 'Estado actualizado' });
        await this.fetch();
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        const status = e.response?.status;
        Notify.create({
          type: 'negative',
          message:
            status === 401 || status === 403
              ? 'No autorizado, inicia sesión como admin'
              : 'Error inesperado, inténtalo de nuevo',
        });
      }
    },
  },
});
