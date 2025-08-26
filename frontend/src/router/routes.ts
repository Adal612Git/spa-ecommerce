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
      { path: 'checkout', component: () => import('pages/CheckoutPage.vue') },
      { path: 'checkout/success', component: () => import('pages/CheckoutSuccessPage.vue') },
      { path: 'checkout/failure', component: () => import('pages/CheckoutFailurePage.vue') },
      { path: 'checkout/pending', component: () => import('pages/CheckoutPendingPage.vue') },
      { path: 'orders', component: () => import('pages/OrdersPage.vue'), meta: { requiresAuth: true } },
      { path: 'product/:id', component: () => import('pages/ProductPage.vue') },
    ],
  },

  {
    path: '/admin',
    component: () => import('layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', component: () => import('pages/admin/ProductsPage.vue') },
      { path: 'products', component: () => import('pages/admin/ProductsPage.vue') },
      { path: 'orders', component: () => import('pages/admin/OrdersPage.vue') },
      { path: 'reviews', component: () => import('pages/admin/ReviewsPage.vue') },
      { path: 'stock', component: () => import('pages/admin/StockPage.vue') },
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
