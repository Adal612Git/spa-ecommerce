import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../src/stores/auth';

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('sets and clears token', () => {
    const auth = useAuthStore();
    expect(auth.isAuthenticated).toBe(false);
    auth.login('a@a.com', 'secret');
    expect(auth.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBeTruthy();
    auth.logout();
    expect(auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
