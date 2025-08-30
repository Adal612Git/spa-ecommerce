<template>
  <div class="row q-col-gutter-md items-start">
    <div class="col">
      <q-input
        v-model="search"
        debounce="300"
        placeholder="Buscar productos"
        dense
      >
        <template #append>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>
    <div class="col-12 col-sm-4" v-if="categories && categories.length">
      <q-select
        v-model="category"
        :options="categories"
        option-label="label"
        option-value="value"
        emit-value
        map-options
        label="Categoría"
        dense
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useProductStore } from 'stores/product';

interface CategoryOption {
  label: string;
  value: string;
}

interface Props {
  categories?: CategoryOption[];
}

defineProps<Props>();

const store = useProductStore();

const search = ref(store.filters.search);
const category = ref(store.filters.category);

watch([search, category], () => {
  store.setFilters({ search: search.value, category: category.value });
});
</script>
