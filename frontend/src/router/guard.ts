import type { Router } from 'vue-router';
import type { Pinia } from 'pinia';
import { useAuthStore } from '../stores/auth';

export function setupAuthGuard(router: Router, pinia: Pinia) {
  router.beforeEach((to) => {
    const auth = useAuthStore(pinia);
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return '/login';
    }
  });
}
