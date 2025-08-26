<template>
  <q-page padding>
    <q-table :rows="rows" :columns="columns">
      <template #body-cell-actions="props">
        <q-btn label="Aprobar" color="primary" size="sm" class="q-mr-sm" />
        <q-btn label="Eliminar" color="negative" size="sm" />
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
const columns = [
  { name: 'id', label: 'ID', field: 'id' },
  { name: 'product', label: 'Producto', field: 'product' },
  { name: 'review', label: 'Reseña', field: 'review' },
  { name: 'actions', label: 'Acciones' }
];
const rows = [] as any[]; // dummy data
</script>
