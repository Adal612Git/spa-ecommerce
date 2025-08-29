<template>
  <q-page padding>
    <q-table :rows="reviewsStore.reviews" :columns="columns">
      <template #body-cell-actions="props">
        <q-btn label="Aprobar" color="primary" size="sm" class="q-mr-sm" @click="async () => { await approve(props.row.id); }" />
        <q-btn label="Eliminar" color="negative" size="sm" @click="async () => { await reject(props.row.id); }" />
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { useReviewsStore } from 'src/stores/reviews';
import type { Review } from 'src/types/review';

const reviewsStore = useReviewsStore();
void reviewsStore.fetch('PENDING');

const columns = [
  { name: 'id', label: 'ID', field: 'id' },
  { name: 'product', label: 'Producto', field: (row: Review) => row.product.name },
  { name: 'rating', label: 'Rating', field: 'rating' },
  { name: 'comment', label: 'Comentario', field: 'comment' },
  { name: 'actions', label: 'Acciones', field: (row: Review) => row.id }
];

async function approve(id: number) {
  await reviewsStore.updateStatus(id, 'APPROVED');
}
async function reject(id: number) {
  await reviewsStore.updateStatus(id, 'REJECTED');
}
</script>
