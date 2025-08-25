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
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCartStore } from 'stores/cartStore';

const cartStore = useCartStore();
const cart = computed(() => cartStore.cart);
const subtotal = computed(() => cartStore.subtotal);
const total = computed(() => cartStore.total);
const currency = computed(() => cart.value[0]?.currency || 'USD');
</script>

<style scoped>
.cart-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
}
</style>
