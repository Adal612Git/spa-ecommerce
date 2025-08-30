<template>
  <q-page padding>
    <ProductSearch />
    <div class="q-mt-md">
      <div class="row q-col-gutter-md">
        <div
          v-for="product in products"
          :key="product.id"
          class="col-12 col-sm-6 col-md-4"
        >
          <ProductCard
            :product="product"
            @add="async (p) => { await onAdd(p); }"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import ProductSearch from 'components/ProductSearch.vue';
import ProductCard from 'components/ProductCard.vue';
import { useProductStore } from 'stores/product'; // 👈 usar el store correcto
import { useCartStore } from 'stores/cart';
import type { Product } from 'src/types/product';

const productStore = useProductStore(); // 👈 este es el de catálogo
const cartStore = useCartStore();

const products = computed(() =>
  productStore.getProducts(1).filter((p) => p.stock > 0),
);

async function onAdd(product: Product) {
  await cartStore.add(product, 1);
}

onMounted(() => {
  void productStore.fetchProducts(1, 12, { force: true });
});
</script>
