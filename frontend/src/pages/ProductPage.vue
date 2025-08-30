<template>
  <q-page padding>
    <div v-if="product">
      <h1>{{ product.name }}</h1>
      <p>{{ product.description }}</p>
      <img v-if="mainImage" :src="mainImage" :alt="product?.name" />
    </div>
    <div v-else>Loading...</div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useMeta } from 'quasar';
import { api } from 'src/api/api';

const route = useRoute();
import type { Product as BaseProduct } from 'src/types/product';

interface Product extends BaseProduct {
  images?: { url: string }[];
}

const product = ref<Product | null>(null);

const mainImage = computed(() => product.value?.images?.[0]?.url || '');

useMeta(() => ({ title: product.value?.name || 'Producto' }));

onMounted(async () => {
  const slug = route.params.slug as string;
const { data } = await api.get(`/api/products/${slug}`);
  product.value = data;
});
</script>
