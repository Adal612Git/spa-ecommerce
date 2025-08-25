import { defineStore } from 'pinia';
import { useQuasar } from 'quasar';
import { useAuthStore } from './auth';

const STORAGE_KEY = 'cart';

export const useCartStore = defineStore('cart', {
  state: () => ({
    cart: JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'),
  }),
  getters: {
    subtotal: (state) =>
      state.cart.reduce(
        (sum, line) => sum + line.price_cents * line.qty,
        0
      ),
    total() {
      return this.subtotal;
    },
  },
  actions: {
    persist() {
      const auth = useAuthStore();
      if (!auth.isAuthenticated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cart));
      } else {
        localStorage.removeItem(STORAGE_KEY);
        // TODO: sync with /cart endpoint when backend ready
      }
    },
    add(product, qty = 1) {
      const $q = useQuasar();
      const existing = this.cart.find((l) => l.productId === product.id);
      const targetQty = existing ? existing.qty + qty : qty;
      const stock = existing ? existing.stock : product.stock;
      if (targetQty > stock) {
        $q.notify({ type: 'negative', message: 'No hay suficiente stock' });
        return;
      }
      if (existing) {
        existing.qty += qty;
      } else {
        this.cart.push({
          lineId: Date.now().toString(),
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price_cents: product.price_cents,
          currency: product.currency,
          qty,
          stock: product.stock,
          image_url: product.image_url,
        });
      }
      this.persist();
      $q.notify({ type: 'positive', message: 'Producto añadido al carrito' });
    },
    updateQty(lineId, qty) {
      const $q = useQuasar();
      const line = this.cart.find((l) => l.lineId === lineId);
      if (!line) return;
      if (qty < 1) {
        $q.notify({ type: 'negative', message: 'La cantidad mínima es 1' });
        return;
      }
      if (qty > line.stock) {
        $q.notify({
          type: 'negative',
          message: `Solo hay ${line.stock} unidades disponibles`,
        });
        return;
      }
      line.qty = qty;
      this.persist();
      $q.notify({ type: 'positive', message: 'Cantidad actualizada' });
    },
    remove(lineId) {
      const $q = useQuasar();
      this.cart = this.cart.filter((l) => l.lineId !== lineId);
      this.persist();
      $q.notify({ type: 'positive', message: 'Producto eliminado del carrito' });
    },
  },
});

