<template>
  <q-page padding>
    <q-btn label="Nuevo producto" color="primary" @click="openDialog()" />
    <q-table :rows="productsStore.products" :columns="columns">
      <template #body-cell-actions="props">
        <q-btn flat icon="edit" @click="openDialog(props.row)" />
        <q-btn flat icon="delete" color="negative" @click="async () => { await remove(props.row.id); }" />
      </template>
    </q-table>

    <q-dialog v-model="dialog">
      <q-card style="min-width:400px">
        <q-card-section>
          <q-input v-model="form.name" label="Nombre" />
          <q-input v-model.number="form.priceCents" label="Precio (cents)" />
          <q-input v-model.number="form.stock" label="Stock" />
          <q-input v-model="form.category" label="Categoría" />
          <q-select v-model="form.status" :options="statusOptions" label="Estado" />
          <input type="file" multiple @change="onFiles" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Guardar" color="primary" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useProductsStore } from 'src/stores/products';
import type { Product } from 'src/types/product';
import axios from 'axios';

const $q = useQuasar();
const productsStore = useProductsStore();

async function fetchProducts() {
  try {
    await productsStore.fetch();
    $q.notify({ type: 'positive', message: 'Productos cargados' });
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    if (status === 401 || status === 403) {
      $q.notify({ type: 'negative', message: 'Acceso denegado: se requiere rol ADMIN' });
    } else if (status === 404) {
      $q.notify({ type: 'negative', message: 'Recurso no encontrado' });
    } else {
      $q.notify({
        type: 'negative',
        message: 'Error cargando productos: ' + (err as Error).message,
      });
    }
  }
}

void fetchProducts();

type AdminProduct = Partial<Product> & {
  category?: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

const columns = [
  { name: 'name', label: 'Nombre', field: 'name' },
  { name: 'price', label: 'Precio', field: 'priceCents', format: (v: number) => `$${(v / 100).toFixed(2)}` },
  { name: 'stock', label: 'Stock', field: 'stock' },
  { name: 'status', label: 'Estado', field: 'status' },
  { name: 'actions', label: 'Acciones', field: (row: Product) => row.id }
];

const dialog = ref(false);
const form = ref<AdminProduct>({});
const files = ref<File[]>([]);
const statusOptions = ['DRAFT','ACTIVE','INACTIVE'];

function openDialog(product?: AdminProduct) {
  form.value = product ? { ...product } : {};
  files.value = [];
  dialog.value = true;
}
function onFiles(e: Event) {
  files.value = Array.from((e.target as HTMLInputElement).files || []);
}
async function save() {
  try {
    await productsStore.save(form.value, files.value);
    $q.notify({ type: 'positive', message: 'Producto guardado' });
    dialog.value = false;
    await fetchProducts();
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    if (status === 401 || status === 403) {
      $q.notify({ type: 'negative', message: 'Acceso denegado: se requiere rol ADMIN' });
    } else if (status === 404) {
      $q.notify({ type: 'negative', message: 'Recurso no encontrado' });
    } else {
      $q.notify({
        type: 'negative',
        message: 'Error guardando producto: ' + (err as Error).message,
      });
    }
  }
}
async function remove(id: number) {
  try {
    await productsStore.delete(id);
    $q.notify({ type: 'positive', message: 'Producto eliminado' });
    await fetchProducts();
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    if (status === 401 || status === 403) {
      $q.notify({ type: 'negative', message: 'Acceso denegado: se requiere rol ADMIN' });
    } else if (status === 404) {
      $q.notify({ type: 'negative', message: 'Recurso no encontrado' });
    } else {
      $q.notify({
        type: 'negative',
        message: 'Error eliminando producto: ' + (err as Error).message,
      });
    }
  }
}
</script>
