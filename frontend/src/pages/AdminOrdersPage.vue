<template>
  <q-page padding>
    <q-select v-model="filter" :options="statuses" label="Estado" @update:model-value="() => void fetch()" />
    <q-table :rows="ordersStore.orders" :columns="columns">
      <template #body-cell-status="props">
        <q-select v-model="props.row.status" :options="statuses" @update:model-value="async val => { await updateStatus(props.row, val); }" />
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useOrdersStore } from 'src/stores/orders';
import type { Order } from 'src/types/order';
import axios from 'axios';

const $q = useQuasar();
const ordersStore = useOrdersStore();
const statuses = ['PENDING','CONFIRMED','SHIPPED','CANCELLED'];
const columns = [
  { name: 'id', label: 'ID', field: 'id' },
  { name: 'status', label: 'Estado', field: 'status' },
  { name: 'total', label: 'Total', field: 'totalCents', format: (v: number) => `$${(v / 100).toFixed(2)}` },
  { name: 'createdAt', label: 'Fecha', field: 'createdAt' }
];

const filter = ref();
async function fetch() {
  try {
    await ordersStore.fetch(filter.value);
    $q.notify({ type: 'positive', message: 'Pedidos cargados' });
  } catch (err) {
    if (axios.isAxiosError(err) && [401, 403].includes(err.response?.status || 0)) {
      $q.notify({ type: 'negative', message: 'Acceso denegado: se requiere rol ADMIN' });
    } else {
      $q.notify({
        type: 'negative',
        message: 'Error cargando pedidos: ' + (err as Error).message,
      });
    }
  }
}
void fetch();
async function updateStatus(row: Order, status: string) {
  try {
    await ordersStore.updateStatus(row.id, status);
    $q.notify({ type: 'positive', message: 'Estado actualizado' });
  } catch (err) {
    if (axios.isAxiosError(err) && [401, 403].includes(err.response?.status || 0)) {
      $q.notify({ type: 'negative', message: 'Acceso denegado: se requiere rol ADMIN' });
    } else {
      $q.notify({
        type: 'negative',
        message: 'Error actualizando pedido: ' + (err as Error).message,
      });
    }
  }
}
</script>
