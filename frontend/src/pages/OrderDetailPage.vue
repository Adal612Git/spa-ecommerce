<template>
  <q-page padding>
    <div v-if="order">
      <h1>Order {{ order.id }}</h1>
      <p>Status: {{ order.status }}</p>
    </div>
    <div v-else>Loading...</div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

interface Order {
  id: number;
  status: string;
}

const route = useRoute();
const order = ref<Order | null>(null);

onMounted(async () => {
  const id = route.params.id as string;
  const { data } = await axios.get(`/api/orders/${id}`);
  order.value = data;
});
</script>
