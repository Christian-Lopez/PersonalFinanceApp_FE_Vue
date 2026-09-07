<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'

const email = ref('')
const isLoading = ref(false)
const isSuccess = ref(false)
const devToken = ref('') // Only for demonstration

const authStore = useAuthStore()

const handleForgot = async () => {
  if (!email.value) return;
  
  isLoading.value = true;
  isSuccess.value = false;
  try {
    const response = await authStore.forgotPassword(email.value);
    isSuccess.value = true;
    if (response?.token) {
        devToken.value = response.token;
    }
  } catch (err) {
    // Error is handled in store
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="p-8 bg-white rounded-lg shadow-md w-96">
      <h1 class="text-2xl font-bold text-center text-gray-800 mb-2">Reset Password</h1>
      <p class="text-center text-gray-500 mb-6 text-sm">Enter your email address and we'll send you a link to reset your password.</p>
      
      <div v-if="authStore.error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
        {{ authStore.error }}
      </div>

      <div v-if="isSuccess" class="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-md text-center">
        <h3 class="text-emerald-800 font-medium mb-1">Check your email</h3>
        <p class="text-sm text-emerald-600">If an account exists for {{ email }}, we have sent password reset instructions.</p>
        
        <div v-if="devToken" class="mt-4 p-3 bg-gray-100 rounded text-left overflow-hidden">
            <p class="text-xs text-gray-500 font-bold mb-1">DEV MODE: Reset Link</p>
            <router-link :to="`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(devToken)}`" class="text-xs text-blue-600 break-all underline">
                Click here to reset password
            </router-link>
        </div>
      </div>
      
      <form v-else @submit.prevent="handleForgot" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input v-model="email" type="email" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="you@example.com" />
        </div>
        
        <button type="submit" :disabled="isLoading" class="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 font-medium mt-4 transition-colors disabled:bg-blue-400">
          {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>
      
      <div class="mt-6 flex flex-col items-center text-sm text-gray-600">
        <router-link to="/login" class="text-blue-600 font-medium hover:underline">
          Back to login
        </router-link>
      </div>
    </div>
  </div>
</template>
