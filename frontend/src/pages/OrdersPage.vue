<template>
  <div class="q-pa-md">
    <h1>Orders</h1>
    <div
      v-for="order in orders"
      :key="order.id"
      class="row items-center q-my-sm"
    >
      <div class="col">
        #{{ order.id }} -
        {{ (order.total_cents / 100).toFixed(2) }} {{ order.currency }}
      </div>
      <OrderStatusBadge :status="order.status" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import OrderStatusBadge from 'components/OrderStatusBadge.vue';

interface Order {
  id: number;
  status: string;
  total_cents: number;
  currency: string;
}

const orders = ref<Order[]>([]);
const auth = useAuthStore();
const apiBase =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

onMounted(async () => {
  const res = await fetch(`${apiBase}/orders`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (res.ok) {
    orders.value = await res.json();
  }
});
</script>

