<template>
  <q-page padding>
    <q-table :rows="reviewsStore.reviews" :columns="columns">
      <template #body-cell-actions="props">
        <q-btn label="Aprobar" color="primary" size="sm" class="q-mr-sm" @click="approve(props.row.id)" />
        <q-btn label="Eliminar" color="negative" size="sm" @click="reject(props.row.id)" />
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { useReviewsStore } from 'src/stores/reviews';

const reviewsStore = useReviewsStore();
reviewsStore.fetch('PENDING');

const columns = [
  { name: 'id', label: 'ID', field: 'id' },
  { name: 'product', label: 'Producto', field: (row:any) => row.product.name },
  { name: 'rating', label: 'Rating', field: 'rating' },
  { name: 'comment', label: 'Comentario', field: 'comment' },
  { name: 'actions', label: 'Acciones' }
];

function approve(id: number) {
  reviewsStore.updateStatus(id, 'APPROVED');
}
function reject(id: number) {
  reviewsStore.updateStatus(id, 'REJECTED');
}
</script>
