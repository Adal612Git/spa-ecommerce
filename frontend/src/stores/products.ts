import { defineStore } from 'pinia';
import { api } from 'src/api/api';
import type { Product } from 'src/types/product';
import { useAuthStore } from './auth';
import { useQuasar } from 'quasar';

export const useProductsStore = defineStore('adminProducts', {
  state: () => ({ products: [] as Product[] }),
  actions: {
    async fetch() {
      const auth = useAuthStore();
      const $q = useQuasar();
      try {
        const { data } = await api.get('/api/admin/products', {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        this.products = data;
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        const status = e.response?.status;
        $q.notify({
          type: 'negative',
          message:
            status === 401
              ? 'No autorizado: inicia sesión como admin'
              : status
              ? `Error ${status}`
              : 'Error inesperado',
        });
      }
    },
    async save(product: Partial<Product>, images: File[]) {
      const auth = useAuthStore();
      const $q = useQuasar();
      const form = new FormData();
      Object.entries(product).forEach(([k, v]) => {
        if (v != null) form.append(k, String(v));
      });
      images.forEach((img) => form.append('images', img));
      try {
        if (product.id) {
          await api.put(`/api/admin/products/${product.id}`, form, {
            headers: { Authorization: `Bearer ${auth.token}` },
          });
        } else {
          await api.post('/api/admin/products', form, {
            headers: { Authorization: `Bearer ${auth.token}` },
          });
        }
        $q.notify({ type: 'positive', message: 'Producto guardado' });
        await this.fetch();
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        const status = e.response?.status;
        $q.notify({
          type: 'negative',
          message:
            status === 401
              ? 'No autorizado: inicia sesión como admin'
              : status
              ? `Error ${status}`
              : 'Error inesperado',
        });
      }
    },
    async updateStock(id: number, stock: number) {
      const auth = useAuthStore();
      const $q = useQuasar();
      try {
        await api.patch(
          `/api/admin/products/${id}/stock`,
          { stock },
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        $q.notify({ type: 'positive', message: 'Stock actualizado' });
        await this.fetch();
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        const status = e.response?.status;
        $q.notify({
          type: 'negative',
          message:
            status === 401
              ? 'No autorizado: inicia sesión como admin'
              : status
              ? `Error ${status}`
              : 'Error inesperado',
        });
      }
    },
    async delete(id: number) {
      const auth = useAuthStore();
      const $q = useQuasar();
      try {
        await api.delete(`/api/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        $q.notify({ type: 'positive', message: 'Producto eliminado' });
        await this.fetch();
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        const status = e.response?.status;
        $q.notify({
          type: 'negative',
          message:
            status === 401
              ? 'No autorizado: inicia sesión como admin'
              : status
              ? `Error ${status}`
              : 'Error inesperado',
        });
      }
    },
  },
});
