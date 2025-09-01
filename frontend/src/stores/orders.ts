import { defineStore } from 'pinia';
import { api } from 'src/api/api';
import { useAuthStore } from './auth';
import type { Order } from 'src/types/order';
import { useQuasar } from 'quasar';

export const useOrdersStore = defineStore('adminOrders', {
  state: () => ({ orders: [] as Order[] }),
  actions: {
    async fetch(status?: string) {
      const auth = useAuthStore();
      const $q = useQuasar();
      try {
        const { data } = await api.get('/api/admin/orders', {
          params: { status },
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        this.orders = data;
      } catch (err: any) {
        const statusCode = err.response?.status;
        $q.notify({
          type: 'negative',
          message:
            statusCode === 401 || statusCode === 403
              ? 'No autorizado'
              : err.response?.data?.message || 'Error al cargar órdenes',
        });
      }
    },
    async updateStatus(id: number, status: string) {
      const auth = useAuthStore();
      const $q = useQuasar();
      try {
        await api.patch(
          `/api/admin/orders/${id}/status`,
          { status },
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        $q.notify({ type: 'positive', message: 'Estado actualizado' });
        await this.fetch();
      } catch (err: any) {
        const statusCode = err.response?.status;
        $q.notify({
          type: 'negative',
          message:
            statusCode === 401 || statusCode === 403
              ? 'No autorizado'
              : err.response?.data?.message || 'Error al actualizar orden',
        });
      }
    },
  },
});
