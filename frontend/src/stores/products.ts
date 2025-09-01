import { defineStore } from 'pinia';
import { api } from 'src/api/api';
import type { Product } from 'src/types/product';
import { useAuthStore } from './auth';
import { Notify } from 'quasar';

type AdminProduct = Partial<Product> & {
  category?: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

export const useProductsStore = defineStore('adminProducts', {
  state: () => ({ products: [] as Product[] }),
  actions: {
    async fetch() {
      const auth = useAuthStore();
      try {
        const { data } = await api.get('/api/admin/products', {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        this.products = data;
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
    async save(product: AdminProduct, images: File[]) {
      const auth = useAuthStore();
      const form = new FormData();
      const { id, name, priceCents, stock, category, status, description } = product;
      if (name != null) form.append('name', String(name));
      if (description != null) form.append('description', String(description));
      if (priceCents != null) form.append('priceCents', String(priceCents));
      if (stock != null) form.append('stock', String(stock));
      if (category != null) form.append('category', String(category));
      if (status != null) form.append('status', String(status));
      images.forEach((img) => form.append('images', img));
      try {
        if (id) {
          await api.put(`/api/admin/products/${id}`, form, {
            headers: { Authorization: `Bearer ${auth.token}` },
          });
        } else {
          await api.post('/api/admin/products', form, {
            headers: { Authorization: `Bearer ${auth.token}` },
          });
        }
        Notify.create({ type: 'positive', message: 'Producto guardado' });
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
    async updateStock(id: number, stock: number) {
      const auth = useAuthStore();
      try {
        await api.patch(
          `/api/admin/products/${id}/stock`,
          { stock },
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        Notify.create({ type: 'positive', message: 'Stock actualizado' });
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
    async delete(id: number) {
      const auth = useAuthStore();
      try {
        await api.delete(`/api/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        Notify.create({ type: 'positive', message: 'Producto eliminado' });
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
