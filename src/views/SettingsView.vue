<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import AppLayout from '../components/AppLayout.vue'

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const isLoading = ref(false)
const isSuccess = ref(false)

const authStore = useAuthStore()

const handleChangePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    authStore.error = "New passwords do not match."
    return
  }

  isLoading.value = true;
  isSuccess.value = false;
  
  try {
    await authStore.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    });
    
    isSuccess.value = true;
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    
    // Clear success message after 3 seconds
    setTimeout(() => {
        isSuccess.value = false;
    }, 3000);
  } catch (err) {
    // Error is handled in store
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <AppLayout>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Settings</h1>
      <p class="text-gray-500 mt-1">Manage your account and preferences.</p>
    </div>

    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-xl">
      <h3 class="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
      
      <div v-if="authStore.error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
        {{ authStore.error }}
      </div>

      <div v-if="isSuccess" class="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-sm font-medium">
        Password changed successfully!
      </div>
      
      <form @submit.prevent="handleChangePassword" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Current Password</label>
          <input v-model="currentPassword" type="password" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">New Password</label>
          <input v-model="newPassword" type="password" required minlength="8" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input v-model="confirmPassword" type="password" required minlength="8" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
        </div>
        
        <button type="submit" :disabled="isLoading" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium mt-4 transition-colors disabled:bg-blue-400">
          {{ isLoading ? 'Updating...' : 'Update Password' }}
        </button>
      </form>
    </div>
  </AppLayout>
</template>
