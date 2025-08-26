<template>
  <q-page padding>
    <div v-if="product">
      <h1>{{ product.name }}</h1>
      <p>{{ product.description }}</p>
      <img v-if="product.images?.length" :src="product.images[0].url" :alt="product.name" />
    </div>
    <div v-else>Loading...</div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useMeta } from 'quasar';
import axios from 'axios';

const route = useRoute();
interface Product {
  id: number;
  name: string;
  description: string;
  images?: { url: string }[];
}

const product = ref<Product | null>(null);

const meta = ref({});
useMeta(meta);

onMounted(async () => {
  const slug = route.params.slug as string;
  const { data } = await axios.get(`/api/products/${slug}`);
  product.value = data;
  meta.value = {
    title: data.name,
    meta: {
      description: { name: 'description', content: data.description },
      ogTitle: { property: 'og:title', content: data.name },
      ogDescription: { property: 'og:description', content: data.description },
      ogImage: { property: 'og:image', content: data.images?.[0]?.url },
      ogUrl: {
        property: 'og:url',
        content: typeof window !== 'undefined' ? window.location.href : '',
      },
    },
  };
});
</script>
