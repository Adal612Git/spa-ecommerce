import { describe, it, expect, beforeEach } from 'vitest';
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { setupAuthGuard } from '../src/router/guard';

const routes: RouteRecordRaw[] = [
  { path: '/login', component: { template: 'login' } },
  {
    path: '/protected',
    component: { template: 'protected' },
    meta: { requiresAuth: true },
  },
];

describe('route guard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to /login when not authenticated', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes });
    const pinia = createPinia();
    setActivePinia(pinia);
    setupAuthGuard(router, pinia);
    await router.push('/protected');
    expect(router.currentRoute.value.fullPath).toBe('/login');
  });
});
