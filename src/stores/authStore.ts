import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../lib/api';

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(localStorage.getItem('token'));
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!token.value);

  // Actions
  async function login(email: string, password: string) {
    error.value = null; // Reset error before trying
    try {
      // Calls POST http://localhost:5000/api/auth/login
      const response = await api.post('/auth/login', { email, password });
      
      // Assuming the C# API returns { "token": "ey..." }
      const jwtToken = response.data.token; 

      if (jwtToken) {
        token.value = jwtToken;
        localStorage.setItem('token', jwtToken); // Save to browser storage
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.response?.data?.title || 'Login failed. Please check your credentials.';
      throw err; // Re-throw so the UI can know it failed
    }
  }

  function logout() {
    token.value = null;
    localStorage.removeItem('token');
  }

  return { token, error, isAuthenticated, login, logout };
});
