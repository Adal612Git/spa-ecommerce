import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../src/stores/auth';

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/auth/login')) {
          return {
            ok: true,
            json: async () => ({ token: 'fake-token' }),
          } as Response;
        }
        if (url.endsWith('/auth/me')) {
          return {
            ok: true,
            json: async () => ({ id: '1', email: 'a@a.com', role: 'ADMIN', createdAt: new Date().toISOString() }),
          } as Response;
        }
        return { ok: false } as Response;
      }),
    );
  });

  it('sets and clears token', async () => {
    const auth = useAuthStore();
    expect(auth.isAuthenticated).toBe(false);
    await auth.login('a@a.com', 'secret');
    expect(auth.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBeTruthy();
    auth.logout();
    expect(auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
