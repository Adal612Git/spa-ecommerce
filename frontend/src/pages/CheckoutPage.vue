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
            {{ line.currency ?? 'MXN' }}
          </div>
        </div>
        <div>x{{ line.qty }}</div>
      </div>

      <q-input v-model="couponCode" label="Cupón" dense />
      <q-btn label="Aplicar" @click="async () => { await applyCoupon(); }" />

      <q-select
        v-model="selectedZone"
        :options="zones"
        label="Zona de envío"
        @update:model-value="async (val) => { await zoneChanged(val); }"
      />

      <div class="text-right q-mt-lg">
        <div>
          Subtotal: {{ (subtotal / 100).toFixed(2) }} {{ currency }}
        </div>
        <div v-if="couponStore.coupon">
          Descuento: -{{ (discount / 100).toFixed(2) }} {{ currency }}
        </div>
        <div>
          Envío: {{ (shippingCost / 100).toFixed(2) }} {{ currency }}
        </div>
        <div>
          Total: {{ (total / 100).toFixed(2) }} {{ currency }}
        </div>
        <CheckoutButton class="q-mt-md" @click="async () => { await pay(); }" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import CheckoutButton from 'components/CheckoutButton.vue';
import { ref, computed } from 'vue';
import { useCartStore } from 'stores/cart';
import { useCouponStore } from 'stores/coupons';
import { useShippingStore } from 'stores/shipping';
import { useQuasar } from 'quasar';

const cartStore = useCartStore();
const couponStore = useCouponStore();
const shippingStore = useShippingStore();
const cart = computed(() => cartStore.cart);
const subtotal = computed(() => cartStore.subtotal);
const discount = computed(() => couponStore.coupon?.discount ?? 0);
const shippingCost = computed(() => shippingStore.cost ?? 0);
const total = computed(
  () => subtotal.value - discount.value + shippingCost.value,
);
const currency = computed(() => cart.value[0]?.currency ?? 'MXN');

const couponCode = ref('');
const selectedZone = ref('');
const zones = ['NORTE', 'SUR', 'CENTRO'];

const $q = useQuasar();
const apiBase =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

async function applyCoupon() {
  try {
    await couponStore.validate(couponCode.value, subtotal.value);
    $q.notify({ type: 'positive', message: 'Cupón aplicado' });
  } catch {
    couponStore.clear();
    $q.notify({ type: 'negative', message: 'Cupón inválido' });
  }
}

async function zoneChanged(val: string) {
  try {
    await shippingStore.loadRates(val);
    const weight = cart.value.reduce((sum, line) => sum + line.qty, 0);
    shippingStore.calculate(weight);
  } catch {
    $q.notify({ type: 'negative', message: 'Error obteniendo tarifas' });
  }
}

async function pay() {
  try {
    if (!selectedZone.value) {
      $q.notify({ type: 'negative', message: 'Selecciona una zona de envío' });
      return;
    }
    const orderRes = await fetch(`${apiBase}/checkout/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.value.map((l) => ({ productId: l.productId, quantity: l.qty })),
        couponId: couponStore.coupon?.id,
        zone: selectedZone.value,
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
