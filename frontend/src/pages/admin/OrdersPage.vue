<template>
  <q-page padding>
    <q-select v-model="filter" :options="statuses" label="Estado" @update:model-value="fetch" />
    <q-table :rows="ordersStore.orders" :columns="columns">
      <template #body-cell-status="props">
        <q-select v-model="props.row.status" :options="statuses" @update:model-value="val => updateStatus(props.row, val)" />
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useOrdersStore } from 'src/stores/orders';

const ordersStore = useOrdersStore();
const statuses = ['PENDING','APPROVED','SHIPPED','CANCELLED'];
const columns = [
  { name: 'id', label: 'ID', field: 'id' },
  { name: 'status', label: 'Estado', field: 'status' },
  { name: 'total', label: 'Total', field: 'totalCents', format: (v:number)=>`$${(v/100).toFixed(2)}` },
  { name: 'createdAt', label: 'Fecha', field: 'createdAt' }
];

const filter = ref();
function fetch() {
  ordersStore.fetch(filter.value);
}
fetch();
function updateStatus(row:any, status:string) {
  ordersStore.updateStatus(row.id, status);
}
</script>
