import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/HomePage.vue') },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'register', component: () => import('pages/RegisterPage.vue') },
      { path: 'product/:slug', component: () => import('pages/ProductPage.vue') },
      { path: 'cart', component: () => import('pages/CartPage.vue') },
      { path: 'checkout', component: () => import('pages/CheckoutPage.vue') },
      {
        path: 'orders',
        component: () => import('pages/OrdersPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
