<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          <router-link to="/" class="text-white">SPA Ecommerce</router-link>
        </q-toolbar-title>
        <q-btn flat round icon="shopping_cart" to="/cart" class="q-mr-sm" />
        <q-btn
          flat
          v-if="!auth.isAuthenticated"
          to="/login"
          label="Login"
          class="q-mr-sm"
        />
        <q-btn flat v-else label="Logout" @click="logout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="text-center q-pa-md">
      © 2025 SPA Ecommerce
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth';

const auth = useAuthStore();
function logout() {
  auth.logout();
}
</script>
