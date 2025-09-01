import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth';
import type { CartItem } from 'src/types/cart';
import type { Product } from 'src/types/product';
import { useQuasar } from 'quasar';

const STORAGE_KEY = 'cart';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '' });

export const useCartStore = defineStore('cart', () => {
  const auth = useAuthStore();
  const $q = useQuasar();
  const cart = ref<CartItem[]>([]);

  // Subtotal y total siempre calculados con priceCents
  const subtotal = computed(() =>
    cart.value.reduce((sum, line) => sum + line.priceCents * line.qty, 0),
  );
  const total = computed(() => subtotal.value);

  // LocalStorage
  function loadLocal() {
    const raw = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]',
    ) as Array<Partial<CartItem>>;
    cart.value = raw.map(
      (item) => ({ ...item, priceCents: item.priceCents ?? 0 } as CartItem),
    );
  }

  function persistLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.value));
  }

  // Cargar carrito remoto
  async function fetchRemote() {
    try {
      const { data } = await api.get('/api/cart', {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      const items = data.items ?? [];
      const mapped: CartItem[] = [];
      for (const item of items) {
        try {
          mapped.push({
            productId: item.product.id,
            name: item.product.name,
            priceCents: item.product.priceCents,
            currency: item.product.currency ?? 'USD',
            qty: item.quantity,
            stock: item.product.stock ?? 0,
            image_url: item.product.image_url ?? '',
          });
        } catch {
          $q.notify({ type: 'negative', message: 'Item de carrito inválido' });
        }
      }
      cart.value = mapped;
    } catch {
      $q.notify({ type: 'negative', message: 'Error cargando carrito' });
      cart.value = [];
    }
  }

  // Fusionar carrito local al remoto
  async function mergeLocalToRemote() {
    const local: CartItem[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]',
    );
    if (local.length) {
      for (const line of local) {
        await api.post(
          '/api/cart/add',
          { productId: line.productId, quantity: line.qty },
          { headers: { Authorization: `Bearer ${auth.token}` } },
        );
      }
      localStorage.removeItem(STORAGE_KEY);
    }
    await fetchRemote();
  }

  // Agregar producto al carrito
  async function add(product: Product, qty = 1) {
    if (auth.isAuthenticated) {
      try {
        await api.post(
          '/api/cart/add',
          { productId: product.id, quantity: qty },
          { headers: { Authorization: `Bearer ${auth.token}` } },
        );
        await fetchRemote();
      } catch {
        $q.notify({ type: 'negative', message: 'Error agregando al carrito' });
      }
    } else {
      const existing = cart.value.find((l) => l.productId === product.id);
      const target = existing ? existing.qty + qty : qty;
      const stock = existing ? existing.stock : product.stock;
      if (target > stock) return;

      if (existing) {
        existing.qty += qty;
      } else {
        cart.value.push({
          productId: product.id,
          name: product.name,
          priceCents: product.priceCents,
          currency: product.currency ?? 'USD',
          qty,
          stock: product.stock,
          image_url: product.image_url || '',
        });
      }
      persistLocal();
    }
  }

  // Actualizar cantidad
  async function updateQty(productId: number, qty: number) {
    if (auth.isAuthenticated) {
      try {
        await api.post(
          '/api/cart/update',
          { productId, quantity: qty },
          { headers: { Authorization: `Bearer ${auth.token}` } },
        );
        await fetchRemote();
      } catch {
        $q.notify({ type: 'negative', message: 'Error actualizando carrito' });
      }
    } else {
      const line = cart.value.find((l) => l.productId === productId);
      if (!line) return;
      line.qty = qty;
      persistLocal();
    }
  }

  // Remover producto
  async function remove(productId: number) {
    if (auth.isAuthenticated) {
      try {
        await api.post(
          '/api/cart/remove',
          { productId },
          { headers: { Authorization: `Bearer ${auth.token}` } },
        );
        await fetchRemote();
      } catch {
        $q.notify({ type: 'negative', message: 'Error removiendo del carrito' });
      }
    } else {
      cart.value = cart.value.filter((l) => l.productId !== productId);
      persistLocal();
    }
  }

  // Sincronización cuando cambia el estado de autenticación
  watch(
    () => auth.isAuthenticated,
    async (logged) => {
      if (logged) {
        await mergeLocalToRemote();
      } else {
        loadLocal();
      }
    },
    { immediate: true },
  );

  return { cart, subtotal, total, add, updateQty, remove };
});
