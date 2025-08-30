<template>
  <q-card flat bordered class="full-width">
    <q-img
      v-if="mainImage"
      :src="mainImage"
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
import type { Product as BaseProduct } from 'src/types/product';

type ProductImage = { url: string };

/**
 * Acepta ambos formatos de backend:
 * - camelCase: priceCents, imageUrl, images[]
 * - snake_case: price_cents, image_url
 */
type ProductView = BaseProduct & {
  images?: ProductImage[];
  image_url?: string;
  imageUrl?: string;
  price_cents?: number;
  priceCents?: number;       // 👈 añadido para que TS no marque error
  currency?: string | null;
};

const props = defineProps<{ product: ProductView }>();
const emit = defineEmits<{ (e: 'add', product: ProductView): void }>();

const mainImage = computed(() =>
  props.product.images?.[0]?.url ??
  props.product.imageUrl ??
  props.product.image_url ??
  ''
);

const formattedPrice = computed(() => {
  const cents =
    props.product.priceCents ??
    props.product.price_cents ??
    0;
  const price = cents / 100;
  const currency = props.product.currency ?? 'MXN';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(price);
});

function onAdd() {
  emit('add', props.product);
}
</script>

<style scoped>
.full-width { width: 100%; }
</style>
