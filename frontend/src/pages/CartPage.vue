<template>
  <q-page class="q-pa-md">
    <div v-if="cart.length === 0" class="text-center q-mt-lg">
      Tu carrito está vacío.
    </div>
    <div v-else class="column q-gutter-y-md">
      <div
        v-for="line in cart"
        :key="line.productId"
        class="row items-center q-gutter-x-md"
      >
        <img v-if="line.image_url" :src="line.image_url" alt="" class="cart-image" />
        <div class="col">
          <div class="text-weight-medium">{{ line.name }}</div>
          <div>
            {{ ((line.priceCents * line.qty) / 100).toFixed(2) }}
            {{ line.currency ?? 'USD' }}
          </div>
        </div>
        <q-input
          type="number"
          :model-value="line.qty"
          min="1"
          :max="line.stock"
          style="width: 80px"
          @update:model-value="async (val: string | number | null) => { await cartStore.updateQty(line.productId, Number(val)); }"
        />
        <q-btn
          dense
          flat
          icon="delete"
          color="negative"
          @click="async () => { await cartStore.remove(line.productId); }"
        />
      </div>
      <div class="text-right q-mt-lg">
        <div>
          Subtotal: {{ (subtotal / 100).toFixed(2) }}
          {{ currency }}
        </div>
        <div>
          Total: {{ (total / 100).toFixed(2) }}
          {{ currency }}
        </div>
        <div class="q-mt-md">
          <q-btn color="primary" label="Pagar" @click="async () => { await pay(); }" />
          <q-btn
            color="negative"
            label="Cancelar"
            class="q-ml-sm"
            @click="cancelOrder"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCartStore } from 'stores/cart';
import { useAuthStore } from 'stores/auth';
import { useQuasar } from 'quasar';
import { api } from 'src/api/api';

const cartStore = useCartStore();
const auth = useAuthStore();
const cart = computed(() => cartStore.items);
const subtotal = computed(() => cartStore.subtotal);
const total = computed(() => cartStore.total);
const currency = computed(() => cart.value[0]?.currency ?? 'USD');
const $q = useQuasar();

async function pay() {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth.token) {
      headers.Authorization = `Bearer ${auth.token}`;
    }
    const orderRes = await fetch('/api/checkout/create-order', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        items: cart.value.map((l) => ({ productId: l.productId, quantity: l.qty })),
      }),
    });
    if (!orderRes.ok) throw new Error('Error creando orden');
    const data = await orderRes.json();
    if (!data.success) throw new Error('Pago no procesado');
    if (data.cartCleared) {
      cartStore.items = [];
    }
    $q.notify({
      type: 'positive',
      message: `Orden #${data.orderId} pagada correctamente`,
    });
  } catch (err) {
    $q.notify({ type: 'negative', message: (err as Error).message });
  }
}

async function cancelOrder() {
  try {
    await api.post('/checkout/cancel-order');
    cartStore.items = [];
    $q.notify({
      type: 'negative',
      message: 'Orden cancelada y carrito vaciado',
    });
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Error al cancelar la orden' });
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
