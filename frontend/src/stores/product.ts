import { defineStore } from 'pinia';
import { api } from 'src/api/api';
import type { Product } from 'src/types/product';

interface Filters {
  search: string;
  category: string;
}

interface ProductsState {
  pages: Record<number, Product[]>;
  total: number;
  loading: boolean;
  error: string | null;
  filters: Filters;
}

export const useProductStore = defineStore('products', {
  state: (): ProductsState => ({
    pages: {},
    total: 0,
    loading: false,
    error: null,
    filters: {
      search: '',
      category: '',
    },
  }),
  getters: {
    getProducts: (state) => (page: number) => state.pages[page] ?? [],
    totalPages: (state) => (limit: number) => Math.ceil(state.total / limit),
  },
  actions: {
    search(query: string) {
      this.setFilters({ search: query });
    },
    setFilters(newFilters: Partial<Filters>) {
      this.filters = { ...this.filters, ...newFilters };
      this.pages = {};
      this.total = 0;
      void this.fetchProducts(1);
    },
    async fetchProducts(
      page = 1,
      limit = 12,
      opts: { force?: boolean; prefetch?: boolean } = {},
    ) {
      const { force = false, prefetch = false } = opts;
      if (this.pages[page] && !force) {
        return;
      }
      if (!prefetch) {
        this.loading = true;
        this.error = null;
      }
      try {
        const params: Record<string, string | number> = {
          page,
          limit,
        };
        if (this.filters.search) params.search = this.filters.search;
        if (this.filters.category) params.category = this.filters.category;

        const { data: json } = await api.get('/api/products', { params });
        this.pages[page] = json.data as Product[];
        this.total = json.meta.total;
      } catch (err: unknown) {
        if (!prefetch) {
          this.error = err instanceof Error ? err.message : 'Unknown error';
        }
      } finally {
        if (!prefetch) {
          this.loading = false;
        }
      }
    },
    applyStockUpdate(productId: number, stock: number) {
      Object.values(this.pages).forEach((products) => {
        const prod = products.find((p) => p.id === productId);
        if (prod) {
          prod.stock = stock;
        }
      });
    },
  },
});
