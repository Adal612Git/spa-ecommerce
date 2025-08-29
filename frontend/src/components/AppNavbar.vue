<template>
  <q-header elevated>
    <q-toolbar>
      <q-toolbar-title>
        <router-link to="/" class="text-white">SPA Ecommerce</router-link>
      </q-toolbar-title>
      <q-btn flat round icon="shopping_cart" :to="'/cart'" class="q-mr-sm" />
      <q-select
        v-model="locale"
        :options="langOptions"
        dense
        borderless
        emit-value
        map-options
        class="q-mr-md"
      />
      <q-btn
        flat
        v-if="!auth.isAuthenticated"
        :to="'/login'"
        :label="t('login')"
        class="q-mr-sm"
      />
      <q-btn flat v-else :label="t('logout')" @click="logout" />
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth';
import { useI18n } from 'vue-i18n';

const auth = useAuthStore();
const { t, locale } = useI18n();
const langOptions = [
  { label: 'ES', value: 'es-MX' },
  { label: 'EN', value: 'en-US' },
];

function logout() {
  auth.logout();
}
</script>

