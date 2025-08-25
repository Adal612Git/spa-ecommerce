import { defineStore } from 'pinia';

export interface Product {
  name: string;
  slug: string;
  description?: string;
  price_cents: number;
  currency: string;
  stock: number;
  image_url?: string;
}

interface Filters {
  text: string;
  category: string;
}

interface ProductsState {
  pages: Record<number, Product[]>;
  total: number;
  loading: boolean;
  error: string | null;
  filters: Filters;
}

export const useProductsStore = defineStore('products', {
  state: (): ProductsState => ({
    pages: {},
    total: 0,
    loading: false,
    error: null,
    filters: {
      text: '',
      category: '',
    },
  }),
  getters: {
    getProducts: (state) => (page: number) => state.pages[page] ?? [],
    totalPages: (state) => (limit: number) => Math.ceil(state.total / limit),
  },
  actions: {
    setFilters(newFilters: Partial<Filters>) {
      this.filters = { ...this.filters, ...newFilters };
      this.pages = {};
      this.total = 0;
      void this.fetchProducts(1);
    },
    async fetchProducts(
      page = 1,
      limit = 12,
      filters: Filters = this.filters,
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
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (filters.text) params.append('text', filters.text);
        if (filters.category) params.append('category', filters.category);
        const res = await fetch(`/products?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const json = await res.json();
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
  },
});
