<template>
  <router-view />
</template>

<script setup lang="ts">
import { getCurrentInstance, onMounted } from 'vue';

const { proxy } = getCurrentInstance()!;

onMounted(() => {
  const socket = proxy?.$socket;
  socket?.on('hello', (payload) => {
    console.log('Evento hello recibido:', payload);
  });
});
</script>
