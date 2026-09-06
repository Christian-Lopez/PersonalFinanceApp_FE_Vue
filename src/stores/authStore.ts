import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../lib/api';

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(localStorage.getItem('token'));
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!token.value);
  
  const user = computed(() => {
    if (!token.value) return null;
    try {
      const payload = token.value.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  });

  const isAdmin = computed(() => {
    if (!user.value) return false;
    const roles = user.value['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] 
               || user.value['role'] 
               || user.value['roles'];
    
    if (!roles) return false;
    if (Array.isArray(roles)) return roles.includes('Admin');
    return roles === 'Admin';
  });

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

  return { token, error, isAuthenticated, user, isAdmin, login, logout };
});
