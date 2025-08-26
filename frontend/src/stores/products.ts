import { defineStore } from 'pinia';
import axios from 'axios';

export const useProductsStore = defineStore('adminProducts', {
  state: () => ({ products: [] as any[] }),
  actions: {
    async fetch() {
      const { data } = await axios.get('/api/admin/products');
      this.products = data;
    },
    async save(product: any, images: File[]) {
      const form = new FormData();
      Object.entries(product).forEach(([k, v]) => form.append(k, v as any));
      images.forEach((img) => form.append('images', img));
      if (product.id) {
        await axios.put(`/api/admin/products/${product.id}`, form);
      } else {
        await axios.post('/api/admin/products', form);
      }
      await this.fetch();
    },
    async updateStock(id: number, stock: number) {
      await axios.patch(`/api/admin/products/${id}/stock`, { stock });
      await this.fetch();
    },
    async delete(id: number) {
      await axios.delete(`/api/admin/products/${id}`);
      await this.fetch();
    },
  },
});
