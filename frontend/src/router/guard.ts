import type { Router } from 'vue-router';
import type { Pinia } from 'pinia';
import { useAuthStore } from '../stores/auth';

export function setupAuthGuard(router: Router, pinia: Pinia) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore(pinia);
    if (auth.token && !auth.user) {
      await auth.fetchMe();
    }
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return '/login';
    }
    if (to.meta.requiresAdmin && !auth.isAdmin) {
      return '/';
    }
  });
}
