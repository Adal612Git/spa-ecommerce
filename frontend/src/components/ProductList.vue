<template>
  <div>
    <div v-if="loading" class="row justify-center q-pa-md">
      <q-spinner size="lg" />
    </div>
    <div v-else-if="error" class="column items-center q-pa-md">
      <div class="text-negative q-mb-sm">{{ error }}</div>
      <q-btn label="Reintentar" color="primary" @click="reload" />
    </div>
    <div v-else>
      <div class="row q-col-gutter-md">
        <div
          v-for="product in products"
          :key="product.slug"
          class="col-12 col-sm-6 col-md-4"
        >
          <ProductCard :product="product" />
        </div>
      </div>
      <div class="row justify-center q-mt-md" v-if="totalPages > 1">
        <q-pagination v-model="page" :max="totalPages" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import ProductCard from './ProductCard.vue';
import { useProductsStore } from 'src/stores/productsStore';

const store = useProductsStore();
const page = ref(1);
const limit = 12;

const products = computed(() => store.getProducts(page.value));
const loading = computed(() => store.loading);
const error = computed(() => store.error);
const totalPages = computed(() => store.totalPages(limit));

function fetchPage(p = page.value, opts: { force?: boolean } = {}) {
  store
    .fetchProducts(p, limit, opts)
    .then(() => {
      if (p < totalPages.value) {
        void store.fetchProducts(p + 1, limit, { prefetch: true });
      }
    })
    .catch(() => undefined);
}

function reload() {
  fetchPage(page.value, { force: true });
}

onMounted(() => {
  fetchPage(page.value);
});

watch(page, (p) => {
  fetchPage(p);
});

watch(
  () => store.filters,
  () => {
    page.value = 1;
  },
  { deep: true },
);
</script>
