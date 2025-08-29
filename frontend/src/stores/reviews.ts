import { defineStore } from 'pinia';
import axios from 'axios';
import type { Review } from 'src/types/review';

export const useReviewsStore = defineStore('adminReviews', {
  state: () => ({ reviews: [] as Review[] }),
  actions: {
    async fetch(status?: string) {
      const { data } = await axios.get('/api/admin/reviews', { params: { status } });
      this.reviews = data;
    },
    async updateStatus(id: number, status: string) {
      await axios.patch(`/api/admin/reviews/${id}/status`, { status });
      await this.fetch();
    },
  },
});
