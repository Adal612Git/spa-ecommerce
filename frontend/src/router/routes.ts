import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'register', component: () => import('pages/RegisterPage.vue') },
      { path: 'cart', component: () => import('pages/CartPage.vue') },
      { path: 'checkout/success', component: () => import('pages/CheckoutSuccessPage.vue') },
      { path: 'checkout/failure', component: () => import('pages/CheckoutFailurePage.vue') },
      { path: 'checkout/pending', component: () => import('pages/CheckoutPendingPage.vue') },
      { path: 'orders', component: () => import('pages/OrdersPage.vue'), meta: { requiresAuth: true } },
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
