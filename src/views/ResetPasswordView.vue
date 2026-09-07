<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const password = ref('')
const confirmPassword = ref('')
const email = ref('')
const token = ref('')
const isLoading = ref(false)
const isSuccess = ref(false)

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

onMounted(() => {
  email.value = route.query.email as string || ''
  token.value = route.query.token as string || ''
})

const handleReset = async () => {
  if (password.value !== confirmPassword.value) {
    authStore.error = "Passwords do not match."
    return
  }

  isLoading.value = true;
  try {
    await authStore.resetPassword({
      email: email.value,
      token: token.value,
      newPassword: password.value
    });
    isSuccess.value = true;
    setTimeout(() => {
        router.push('/login');
    }, 3000);
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
      <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">Create New Password</h1>
      
      <div v-if="authStore.error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
        {{ authStore.error }}
      </div>

      <div v-if="isSuccess" class="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-md text-center">
        <h3 class="text-emerald-800 font-medium mb-1">Password Reset!</h3>
        <p class="text-sm text-emerald-600">Your password has been changed successfully. Redirecting to login...</p>
      </div>
      
      <form v-else @submit.prevent="handleReset" class="space-y-4">
        <!-- Hidden fields purely for accessibility/autofill context, though not strictly required if we pass them in payload -->
        <input type="hidden" v-model="email" />
        
        <div>
          <label class="block text-sm font-medium text-gray-700">New Password</label>
          <input v-model="password" type="password" required minlength="8" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input v-model="confirmPassword" type="password" required minlength="8" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
        </div>
        
        <button type="submit" :disabled="isLoading || !email || !token" class="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 font-medium mt-4 transition-colors disabled:bg-blue-400">
          {{ isLoading ? 'Resetting...' : 'Reset Password' }}
        </button>
        
        <p v-if="!email || !token" class="text-xs text-red-500 mt-2 text-center">Missing reset token. Please request a new link.</p>
      </form>
    </div>
  </div>
</template>
