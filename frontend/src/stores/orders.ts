import { defineStore } from 'pinia';
import axios from 'axios';

export const useOrdersStore = defineStore('adminOrders', {
  state: () => ({ orders: [] as any[] }),
  actions: {
    async fetch(status?: string) {
      const { data } = await axios.get('/api/admin/orders', { params: { status } });
      this.orders = data;
    },
    async updateStatus(id: number, status: string) {
      await axios.patch(`/api/admin/orders/${id}/status`, { status });
      await this.fetch();
    },
  },
});
