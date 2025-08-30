import { defineStore } from 'pinia';
import { api } from 'src/api/api';
import type { Product } from 'src/types/product';

export const useProductsStore = defineStore('adminProducts', {
  state: () => ({ products: [] as Product[] }),
  actions: {
    async fetch() {
      const { data } = await api.get('/api/admin/products');
      this.products = data;
    },
    async save(product: Partial<Product>, images: File[]) {
      const form = new FormData();
      Object.entries(product).forEach(([k, v]) => {
        if (v != null) form.append(k, String(v));
      });
      images.forEach((img) => form.append('images', img));

      if (product.id) {
        await api.put(`/api/admin/products/${product.id}`, form);
      } else {
        await api.post('/api/admin/products', form);
      }

      await this.fetch();
    },
    async updateStock(id: number, stock: number) {
      await api.patch(`/api/admin/products/${id}/stock`, { stock });
      await this.fetch();
    },
    async delete(id: number) {
      await api.delete(`/api/admin/products/${id}`);
      await this.fetch();
    },
  },
});
