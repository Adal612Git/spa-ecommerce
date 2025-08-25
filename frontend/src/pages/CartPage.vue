<template>
  <q-page class="q-pa-md">
    <div v-if="cart.length === 0" class="text-center q-mt-lg">
      Tu carrito está vacío.
    </div>
    <div v-else class="column q-gutter-y-md">
      <div
        v-for="line in cart"
        :key="line.lineId"
        class="row items-center q-gutter-x-md"
      >
        <img :src="line.image_url" alt="" class="cart-image" />
        <div class="col">
          <div class="text-weight-medium">{{ line.name }}</div>
          <div>{{ (line.price_cents / 100).toFixed(2) }} {{ line.currency }}</div>
        </div>
        <q-input
          type="number"
          :model-value="line.qty"
          min="1"
          :max="line.stock"
          style="width: 80px"
          @update:model-value="(val) => cartStore.updateQty(line.lineId, Number(val))"
        />
        <q-btn
          dense
          flat
          icon="delete"
          color="negative"
          @click="cartStore.remove(line.lineId)"
        />
      </div>
      <div class="text-right q-mt-lg">
        <div>
          Subtotal: {{ (subtotal / 100).toFixed(2) }} {{ currency }}
        </div>
        <div>
          Total: {{ (total / 100).toFixed(2) }} {{ currency }}
        </div>
        <q-btn color="primary" label="Pagar" class="q-mt-md" @click="pay" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCartStore } from 'stores/cartStore';
import { useQuasar } from 'quasar';

const cartStore = useCartStore();
const cart = computed(() => cartStore.cart);
const subtotal = computed(() => cartStore.subtotal);
const total = computed(() => cartStore.total);
const currency = computed(() => cart.value[0]?.currency || 'USD');
const $q = useQuasar();
const apiBase = import.meta.env.VITE_API_BASE_URL;

async function pay() {
  try {
    const orderRes = await fetch(`${apiBase}/checkout/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.value.map((l) => ({ productId: l.productId, qty: l.qty })),
      }),
    });
    if (!orderRes.ok) throw new Error('Error creando orden');
    const { orderId } = await orderRes.json();

    const prefRes = await fetch(`${apiBase}/checkout/create-preference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    if (!prefRes.ok) throw new Error('Error creando preferencia');
    const { init_point } = await prefRes.json();
    window.location.href = init_point;
  } catch (err) {
    $q.notify({ type: 'negative', message: (err as Error).message });
  }
}
</script>

<style scoped>
.cart-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
}
</style>
