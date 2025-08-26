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
          <ProductCard :product="product" @add="onAdd" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import ProductSearch from 'components/ProductSearch.vue';
import ProductCard from 'components/ProductCard.vue';
import { useProductsStore } from 'stores/productsStore';
import { useCartStore } from 'stores/cart';

const productStore = useProductsStore();
const cartStore = useCartStore();

const products = computed(() =>
  productStore.getProducts(1).filter((p) => p.stock > 0),
);

function onAdd(product: any) {
  cartStore.add(product, 1);
}

onMounted(() => {
  void productStore.fetchProducts(1, 12, { force: true });
});
</script>

