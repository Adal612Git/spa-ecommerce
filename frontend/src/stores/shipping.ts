import { defineStore } from 'pinia';

interface Rate {
  id: number;
  zone: string;
  minWeight: number;
  maxWeight: number;
  priceCents: number;
}

export const useShippingStore = defineStore('shipping', {
  state: () => ({
    zone: '',
    rates: [] as Rate[],
    cost: 0,
  }),
  actions: {
    async loadRates(zone: string) {
      const apiBase =
        import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${apiBase}/api/shipping/${zone}`);
      if (!res.ok) throw new Error('No se pudieron cargar las tarifas');
      this.rates = await res.json();
      this.zone = zone;
    },
    calculate(weight: number) {
      const rate = this.rates.find(
        (r) => weight >= r.minWeight && weight <= r.maxWeight,
      );
      this.cost = rate ? rate.priceCents : 0;
      return this.cost;
    },
    clear() {
      this.zone = '';
      this.rates = [];
      this.cost = 0;
    },
  },
});
