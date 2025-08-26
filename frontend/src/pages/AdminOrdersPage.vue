<template>
  <div class="q-pa-md">
    <q-table
      title="Orders"
      :rows="orders"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :pagination="pagination"
      @request="onRequest"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <OrderStatusBadge :status="props.row.status" />
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import type { QTableProps } from 'quasar';
import OrderStatusBadge from 'components/OrderStatusBadge.vue';

interface Order {
  id: number;
  status: string;
  total_cents: number;
  created_at: string;
}

const apiBase =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
const auth = useAuthStore();
const orders = ref<Order[]>([]);
const loading = ref(false);
const pagination = ref({ page: 1, rowsPerPage: 10, rowsNumber: 0 });

const columns: QTableProps['columns'] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'left' },
  {
    name: 'total',
    label: 'Total',
    field: (row: Order) =>
      (row.total_cents / 100).toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }),
  },
  {
    name: 'created_at',
    label: 'Fecha',
    field: (row: Order) => new Date(row.created_at).toLocaleString(),
  },
];

async function fetchOrders(page = 1, limit = 10) {
  loading.value = true;
  try {
    const res = await fetch(`${apiBase}/admin/orders?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (res.ok) {
      const data = await res.json();
      orders.value = data.orders;
      pagination.value.page = data.page;
      pagination.value.rowsPerPage = data.limit;
      pagination.value.rowsNumber = data.total;
    }
  } finally {
    loading.value = false;
  }
}

function onRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  const { page, rowsPerPage } = props.pagination;
  fetchOrders(page, rowsPerPage);
}

fetchOrders();
</script>

