<template>
  <q-badge :color="color">{{ status }}</q-badge>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  status: string;
}

const props = defineProps<Props>();

const color = computed(() => {
  switch (props.status) {
    case 'pending':
      return 'warning';
    case 'paid':
      return 'positive';
    case 'shipped':
      return 'info';
    case 'cancelled':
      return 'negative';
    default:
      return 'grey';
  }
});
</script>

