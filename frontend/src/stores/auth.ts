import { defineStore } from 'pinia';

interface AuthState {
  token: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    login(email: string, password: string) {
      void email;
      void password;
      // TODO: replace with real API call
      this.token = 'fake-token';
      localStorage.setItem('token', this.token);
    },
    register(email: string, name: string, password: string) {
      void email;
      void name;
      void password;
      // TODO: replace with real API call
      this.token = 'fake-token';
      localStorage.setItem('token', this.token);
    },
    logout() {
      this.token = null;
      localStorage.removeItem('token');
    },
  },
});
