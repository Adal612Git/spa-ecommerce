import { defineStore } from 'pinia';
import { api } from 'src/api/api';
import { useAuthStore } from './auth';
import type { Order } from 'src/types/order';

export const useOrdersStore = defineStore('adminOrders', {
  state: () => ({ orders: [] as Order[] }),
  actions: {
    async fetch(status?: string) {
      const auth = useAuthStore();
      const { data } = await api.get('/admin/orders', {
        params: { status },
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      this.orders = data;
    },
    async updateStatus(id: number, status: string) {
      const auth = useAuthStore();
      await api.patch(
        `/admin/orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      await this.fetch();
    },
  },
});
