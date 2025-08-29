<template>
  <q-card flat bordered class="full-width">
    <q-img
      :src="product.image_url"
      :alt="product.name"
      loading="lazy"
      ratio="1"
    />
    <q-card-section>
      <div class="text-h6">{{ product.name }}</div>
      <div class="text-subtitle2">{{ formattedPrice }}</div>
      <div class="text-caption">Stock: {{ product.stock }}</div>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn
        label="Agregar"
        color="primary"
        :disable="product.stock === 0"
        @click="onAdd"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Product } from 'src/types/product';

const props = defineProps<{ product: Product }>();
const emit = defineEmits<{ (e: 'add', product: Product): void }>();

const formattedPrice = computed(() => {
  const price = props.product.price_cents / 100;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: props.product.currency,
  }).format(price);
});

function onAdd() {
  emit('add', props.product);
}
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
