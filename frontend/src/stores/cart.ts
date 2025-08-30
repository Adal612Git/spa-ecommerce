import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth';
import type { CartItem } from 'src/types/cart';
import type { Product } from 'src/types/product';

const STORAGE_KEY = 'cart';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '' });

export const useCartStore = defineStore('cart', () => {
  const auth = useAuthStore();
  const cart = ref<CartItem[]>([]);

  // Subtotal y total siempre calculados con price_cents
  const subtotal = computed(() =>
    cart.value.reduce((sum, line) => sum + line.price_cents * line.qty, 0),
  );
  const total = subtotal;

  // LocalStorage
  function loadLocal() {
    cart.value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  }

  function persistLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.value));
  }

  // Cargar carrito remoto y normalizar a price_cents
  async function fetchRemote() {
    const { data } = await api.get('/api/cart', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    cart.value = (data.items ?? []).map((item: any) => ({
      ...item,
      price_cents: item.price_cents ?? item.priceCents ?? 0,
    }));
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
      await api.post(
        '/api/cart/add',
        { productId: product.id, quantity: qty },
        { headers: { Authorization: `Bearer ${auth.token}` } },
      );
      await fetchRemote();
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
          // 👇 siempre convertimos a snake_case para el carrito
          price_cents: product.price_cents ?? product.priceCents ?? 0,
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
      await api.post(
        '/api/cart/update',
        { productId, quantity: qty },
        { headers: { Authorization: `Bearer ${auth.token}` } },
      );
      await fetchRemote();
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
      await api.post(
        '/api/cart/remove',
        { productId },
        { headers: { Authorization: `Bearer ${auth.token}` } },
      );
      await fetchRemote();
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
