import { defineStore } from 'pinia';
import { api } from 'src/api/api';
import type { Product } from 'src/types/product';
import { useAuthStore } from './auth';

export const useProductsStore = defineStore('adminProducts', {
  state: () => ({ products: [] as Product[] }),
  actions: {
    async fetch() {
      const auth = useAuthStore();
      const { data } = await api.get('/admin/products', {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      this.products = data;
    },
    async save(product: Partial<Product>, images: File[]) {
      const auth = useAuthStore();
      const form = new FormData();
      Object.entries(product).forEach(([k, v]) => {
        if (v != null) form.append(k, String(v));
      });
      images.forEach((img) => form.append('images', img));

      if (product.id) {
        await api.put(`/admin/products/${product.id}`, form, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
      } else {
        await api.post('/admin/products', form, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
      }

      await this.fetch();
    },
    async updateStock(id: number, stock: number) {
      const auth = useAuthStore();
      await api.patch(
        `/admin/products/${id}/stock`,
        { stock },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      await this.fetch();
    },
    async delete(id: number) {
      const auth = useAuthStore();
      await api.delete(`/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      await this.fetch();
    },
  },
});
