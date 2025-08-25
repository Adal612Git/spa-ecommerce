<template>
  <div class="q-pa-md">
    <h1>Orders</h1>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { socket } from 'src/boot/socket';

const $q = useQuasar();

function handleStatusChange(payload: { orderId: number; status: string }) {
  $q.notify({ message: `Order ${payload.orderId} ${payload.status}`, color: 'primary' });
}

onMounted(() => {
  socket.on('order:statusChanged', handleStatusChange);
});

onUnmounted(() => {
  socket.off('order:statusChanged', handleStatusChange);
});
</script>
