<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../lib/api'

const email = ref('')
const token = ref('')
const isLoading = ref(true)
const isSuccess = ref(false)
const error = ref<string | null>(null)

const router = useRouter()
const route = useRoute()

onMounted(async () => {
  email.value = route.query.email as string || ''
  token.value = route.query.token as string || ''

  if (!email.value || !token.value) {
    error.value = "Invalid verification link. Missing email or token."
    isLoading.value = false
    return
  }

  try {
    await api.post('/auth/verify-email', { email: email.value, token: token.value })
    isSuccess.value = true
    setTimeout(() => {
        router.push('/login')
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.errors?.join(', ') || err.response?.data?.title || 'Verification failed. The link may have expired.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="p-8 bg-white rounded-lg shadow-md w-96 text-center">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Email Verification</h1>
      
      <div v-if="isLoading" class="text-gray-600 flex flex-col items-center">
        <svg class="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Verifying your email...</p>
      </div>

      <div v-else-if="error" class="p-4 bg-red-100 text-red-700 rounded-md text-sm text-left">
        <p class="font-bold mb-1">Verification failed</p>
        {{ error }}
      </div>

      <div v-else-if="isSuccess" class="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
        <h3 class="text-emerald-800 font-bold text-lg mb-1">Email Verified!</h3>
        <p class="text-sm text-emerald-600">Your account is now active. Redirecting to login...</p>
      </div>
      
      <div class="mt-8" v-if="!isLoading">
        <router-link to="/login" class="text-blue-600 font-medium hover:underline text-sm">
          Return to login
        </router-link>
      </div>
    </div>
  </div>
</template>
