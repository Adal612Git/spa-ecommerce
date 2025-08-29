<template>
  <q-page padding>
    <q-table :rows="productsStore.products" :columns="columns">
      <template #body-cell-stock="props">
        <q-input v-model.number="props.row.stock" type="number" dense style="width:80px" />
      </template>
      <template #body-cell-actions="props">
        <q-btn label="Actualizar" color="primary" size="sm" @click="async () => { await update(props.row); }" />
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { useProductsStore } from 'src/stores/products';
import type { Product } from 'src/types/product';

const productsStore = useProductsStore();
void productsStore.fetch();

const columns = [
  { name: 'name', label: 'Producto', field: 'name' },
  { name: 'stock', label: 'Stock', field: 'stock' },
  { name: 'actions', label: 'Acciones', field: (row: Product) => row.id }
];

async function update(row: Product) {
  await productsStore.updateStock(row.id, row.stock);
}
</script>
