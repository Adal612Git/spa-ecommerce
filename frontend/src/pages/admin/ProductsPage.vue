<template>
  <q-page padding>
    <q-btn label="Nuevo producto" color="primary" @click="openDialog()" />
    <q-table :rows="productsStore.products" :columns="columns">
      <template #body-cell-actions="props">
        <q-btn flat icon="edit" @click="openDialog(props.row)" />
        <q-btn flat icon="delete" color="negative" @click="remove(props.row.id)" />
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
import { useProductsStore } from 'src/stores/products';

const productsStore = useProductsStore();
productsStore.fetch();

const columns = [
  { name: 'name', label: 'Nombre', field: 'name' },
  { name: 'price', label: 'Precio', field: 'priceCents', format: (v:number)=>`$${(v/100).toFixed(2)}` },
  { name: 'stock', label: 'Stock', field: 'stock' },
  { name: 'status', label: 'Estado', field: 'status' },
  { name: 'actions', label: 'Acciones' }
];

const dialog = ref(false);
const form = ref<any>({});
const files = ref<File[]>([]);
const statusOptions = ['DRAFT','ACTIVE','INACTIVE'];

function openDialog(product?: any) {
  form.value = product ? { ...product } : {};
  files.value = [];
  dialog.value = true;
}
function onFiles(e: Event) {
  files.value = Array.from((e.target as HTMLInputElement).files || []);
}
async function save() {
  await productsStore.save(form.value, files.value);
  dialog.value = false;
}
async function remove(id: number) {
  await productsStore.delete(id);
}
</script>
