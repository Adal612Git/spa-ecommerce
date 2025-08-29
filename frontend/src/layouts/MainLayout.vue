<template>
  <q-layout view="hHh lpR fFf">
    <AppNavbar />
    <q-page-container>
      <router-view />
    </q-page-container>
    <AppFooter />
  </q-layout>
</template>

<script setup lang="ts">
import AppNavbar from 'components/AppNavbar.vue';
import AppFooter from 'components/AppFooter.vue';
</script>

