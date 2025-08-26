<template>
  <q-layout view="hHh lpR fFf">
    <Navbar />
    <q-page-container>
      <router-view />
    </q-page-container>
    <Footer />
  </q-layout>
</template>

<script setup lang="ts">
import Navbar from 'components/Navbar.vue';
import Footer from 'components/Footer.vue';
</script>

