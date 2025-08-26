import { defineStore } from 'pinia';

export const useCouponStore = defineStore('coupons', {
  state: () => ({
    coupon: null as null | { id: number; code: string; discount: number },
  }),
  actions: {
    async validate(code: string, total: number) {
      const apiBase =
        import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${apiBase}/api/coupons/${code}?total=${total}`);
      if (!res.ok) {
        throw new Error('Cupón inválido');
      }
      this.coupon = await res.json();
    },
    clear() {
      this.coupon = null;
    },
  },
});
