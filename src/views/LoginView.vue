<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const email = ref('')
const password = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  if (!email.value || !password.value) return;
  
  isLoading.value = true;
  try {
    await authStore.login(email.value, password.value);
    // If successful, redirect to the Dashboard!
    router.push('/');
  } catch (err) {
    // Error is saved in authStore.error automatically
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="p-8 bg-white rounded-lg shadow-md w-96">
      <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">Personal Finance</h1>
      <p class="text-center text-gray-500 mb-6">Sign in to your account</p>
      
      <!-- Show error message if login fails -->
      <div v-if="authStore.error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
        {{ authStore.error }}
      </div>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" 
            placeholder="you@example.com" 
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input 
            v-model="password" 
            type="password" 
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" 
          />
        </div>
        
        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 font-medium mt-4 transition-colors disabled:bg-blue-400"
        >
          {{ isLoading ? 'Logging in...' : 'Log In' }}
        </button>
      </form>
    </div>
  </div>
</template>
