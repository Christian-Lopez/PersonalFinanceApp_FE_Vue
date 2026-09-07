<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    authStore.error = "Passwords do not match."
    return
  }

  isLoading.value = true;
  try {
    await authStore.register({
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      password: password.value,
      defaultCurrency: 'USD'
    });
    router.push('/');
  } catch (err) {
    // Error is handled in store
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100 py-12">
    <div class="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
      <h1 class="text-2xl font-bold text-center text-gray-800 mb-2">Create an Account</h1>
      <p class="text-center text-gray-500 mb-6">Start managing your personal finances</p>
      
      <div v-if="authStore.error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
        {{ authStore.error }}
      </div>
      
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">First Name</label>
            <input v-model="firstName" type="text" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Last Name</label>
            <input v-model="lastName" type="text" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input v-model="email" type="email" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="you@example.com" />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input v-model="password" type="password" required minlength="8" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input v-model="confirmPassword" type="password" required minlength="8" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
        </div>
        
        <button type="submit" :disabled="isLoading" class="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 font-medium mt-4 transition-colors disabled:bg-blue-400">
          {{ isLoading ? 'Creating Account...' : 'Sign Up' }}
        </button>
      </form>
      
      <div class="mt-6 flex flex-col items-center text-sm text-gray-600">
        <p>
          Already have an account? 
          <router-link to="/login" class="text-blue-600 font-medium hover:underline">
            Log in
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
