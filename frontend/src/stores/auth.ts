import { defineStore } from 'pinia';

interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  createdAt: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
}

const apiBase =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    user: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'ADMIN',
  },
  actions: {
    async login(email: string, password: string) {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      this.token = data.token;
      if (this.token) localStorage.setItem('token', this.token);
      await this.fetchMe();
    },
    async register(email: string, name: string, password: string) {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) throw new Error('Register failed');
      await this.login(email, password);
    },
    async fetchMe() {
      if (!this.token) return;
      const res = await fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (res.ok) {
        this.user = await res.json();
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
    },
  },
});
