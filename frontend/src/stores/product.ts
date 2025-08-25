import { defineStore } from 'pinia';

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as unknown[],
  }),
  actions: {
    async fetchProducts() {
      // TODO: implement product fetching
    },
  },
});
