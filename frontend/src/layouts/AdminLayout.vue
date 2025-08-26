<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>Admin</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above bordered>
      <q-list>
        <q-item to="/admin/products" clickable>Productos</q-item>
        <q-item to="/admin/orders" clickable>Órdenes</q-item>
        <q-item to="/admin/reviews" clickable>Reseñas</q-item>
        <q-item to="/admin/stock" clickable>Stock</q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
</script>
