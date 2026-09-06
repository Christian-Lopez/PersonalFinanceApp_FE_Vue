<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import AppLayout from '../components/AppLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const accounts = ref<any[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const showNewAccountModal = ref(false)

const newAccount = ref({
  name: '',
  type: 1, // Default to Checking
  currency: 'USD',
  initialBalance: 0
})

const getAccountTypeName = (typeEnum: number) => {
  const types: Record<number, string> = {
    1: 'Checking',
    2: 'Savings',
    3: 'Credit Card',
    4: 'Cash',
    5: 'Investment'
  }
  return types[typeEnum] || 'Unknown'
}

const loadAccounts = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/accounts')
    accounts.value = response.data
  } catch (err) {
    console.error('Failed to load accounts', err)
  } finally {
    isLoading.value = false
  }
}

const createAccount = async () => {
  isSubmitting.value = true
  try {
    await api.post('/accounts', newAccount.value)
    showNewAccountModal.value = false
    
    // Reset form
    newAccount.value.name = ''
    newAccount.value.type = 1
    newAccount.value.initialBalance = 0
    
    // Reload
    await loadAccounts()
  } catch (err) {
    console.error('Error creating account', err)
  } finally {
    isSubmitting.value = false
  }
}

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  loadAccounts()
})
</script>

<template>
  <AppLayout>
    <div class="mb-8 flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Accounts</h1>
        <p class="text-gray-500 mt-1">Manage your bank accounts, credit cards, and cash.</p>
      </div>
      <button @click="showNewAccountModal = true" class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        Add Account
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="accounts.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-gray-400">
      <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
      <p class="text-lg font-medium text-gray-600 mb-2">No accounts found</p>
      <p class="text-sm">Create your first account to start tracking your finances.</p>
      <button @click="showNewAccountModal = true" class="mt-6 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
        Create Account
      </button>
    </div>

    <!-- Accounts Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="acc in accounts" :key="acc.id" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" @click="router.push('/transactions')">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-lg font-bold text-gray-900">{{ acc.name }}</h3>
            <span class="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
              {{ getAccountTypeName(acc.type) }}
            </span>
          </div>
          <div class="p-2 bg-blue-50 rounded-lg text-blue-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
          </div>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">Current Balance</p>
          <p class="text-3xl font-bold" :class="acc.currentBalance < 0 ? 'text-rose-600' : 'text-gray-900'">
            {{ formatCurrency(acc.currentBalance, acc.currency) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Modal for New Account -->
    <div v-if="showNewAccountModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">Add New Account</h3>
          <button @click="showNewAccountModal = false" class="text-gray-400 hover:text-gray-500">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form @submit.prevent="createAccount" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Account Name</label>
            <input v-model="newAccount.name" type="text" placeholder="e.g. Chase Checking" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Account Type</label>
            <select v-model.number="newAccount.type" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500">
              <option :value="1">Checking</option>
              <option :value="2">Savings</option>
              <option :value="3">Credit Card</option>
              <option :value="4">Cash</option>
              <option :value="5">Investment</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Initial Balance</label>
            <input v-model.number="newAccount.initialBalance" type="number" step="0.01" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
          </div>
          
          <div class="pt-4 flex justify-end gap-3">
            <button type="button" @click="showNewAccountModal = false" class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="isSubmitting" class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>

  </AppLayout>
</template>
