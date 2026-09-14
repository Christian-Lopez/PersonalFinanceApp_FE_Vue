<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import api from '../lib/api'

// State
const subscriptions = ref<any[]>([])
const accounts = ref<any[]>([])
const categories = ref<any[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const showNewModal = ref(false)

const selectedParentCategoryId = ref('')

const availableSubcategories = computed(() => {
  if (!selectedParentCategoryId.value) return []
  return categories.value.filter(c => c.parentCategoryId === selectedParentCategoryId.value)
})

const newSubscription = ref({
  amount: 0,
  type: 2, // Expense
  frequency: 3, // Monthly
  startDate: new Date().toISOString().split('T')[0],
  description: '',
  categoryId: '',
  accountId: ''
})

const loadData = async () => {
  isLoading.value = true
  try {
    const [subRes, accRes, catRes] = await Promise.all([
      api.get('/recurringtransactions'),
      api.get('/accounts'),
      api.get('/categories')
    ])
    subscriptions.value = subRes.data
    accounts.value = accRes.data
    categories.value = catRes.data
    
    if (accounts.value.length > 0 && !newSubscription.value.accountId) {
      newSubscription.value.accountId = accounts.value[0].id
    }
  } catch (error) {
    console.error('Failed to load subscriptions', error)
  } finally {
    isLoading.value = false
  }
}

const submitNewSubscription = async () => {
  isSubmitting.value = true
  try {
    const payload = {
      ...newSubscription.value,
      categoryId: newSubscription.value.categoryId || null
    }
    await api.post('/recurringtransactions', payload)
    showNewModal.value = false
    await loadData() // refresh list
  } catch (error) {
    console.error('Failed to create subscription', error)
    alert('Failed to create subscription.')
  } finally {
    isSubmitting.value = false
  }
}

const handleParentChange = () => {
  newSubscription.value.categoryId = ''
}

const openModal = () => {
  selectedParentCategoryId.value = ''
  newSubscription.value = {
    amount: 0,
    type: 2, // Expense
    frequency: 3, // Monthly
    startDate: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
    accountId: accounts.value.length > 0 ? accounts.value[0].id : ''
  }
  showNewModal.value = true
}

const cancelSubscription = async (id: string) => {
  if (!confirm('Are you sure you want to cancel this recurring transaction?')) return
  
  try {
    await api.delete(`/recurringtransactions/${id}`)
    await loadData()
  } catch (error) {
    console.error('Failed to cancel subscription', error)
    alert('Failed to cancel subscription.')
  }
}

const forceRunCatchUp = async () => {
  try {
    const res = await api.post('/recurringtransactions/process')
    alert(`Processed ${res.data.processedCount} due transactions!`)
    await loadData()
  } catch (error) {
    console.error('Failed to process', error)
  }
}

const getFrequencyLabel = (freq: number) => {
  switch (freq) {
    case 1: return 'Daily'
    case 2: return 'Weekly'
    case 3: return 'Monthly'
    case 4: return 'Yearly'
    default: return 'Unknown'
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <AppLayout>
    <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p class="text-gray-600">Manage your recurring income and expenses.</p>
      </div>
      <div class="flex gap-3">
        <button @click="forceRunCatchUp" class="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition font-medium">
          Run Catch-Up
        </button>
        <button @click="openModal" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2">
          <span>+ Add Recurring</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="subscriptions.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No active subscriptions</h3>
      <p class="text-gray-500 mb-6">Automate your regular bills or salary deposits.</p>
      <button @click="openModal" class="text-blue-600 font-medium hover:text-blue-800">
        Create your first recurring transaction &rarr;
      </button>
    </div>

    <!-- Subscriptions Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="sub in subscriptions" :key="sub.id" 
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden"
        :class="sub.isActive ? '' : 'opacity-60 bg-gray-50'">
        
        <div v-if="!sub.isActive" class="absolute top-0 right-0 bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
          Cancelled
        </div>

        <div class="flex justify-between items-start mb-4 mt-2">
          <div>
            <h3 class="font-bold text-gray-900 text-lg">{{ sub.description || 'Unnamed Subscription' }}</h3>
            <p class="text-sm text-gray-500">{{ sub.accountName }}</p>
          </div>
          <div class="text-right">
            <span class="font-bold text-lg" :class="sub.type === 1 ? 'text-green-600' : 'text-gray-900'">
              {{ sub.type === 1 ? '+' : '-' }}${{ sub.amount.toFixed(2) }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 mb-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {{ getFrequencyLabel(sub.frequency) }}
          </span>
          <span v-if="sub.categoryName" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {{ sub.categoryName }}
          </span>
        </div>

        <div class="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center">
          <div>
            <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Next Due</p>
            <p class="text-sm font-medium" :class="new Date(sub.nextDueDate) <= new Date() ? 'text-red-600' : 'text-gray-900'">
              {{ new Date(sub.nextDueDate).toLocaleDateString() }}
            </p>
          </div>
          <button v-if="sub.isActive" @click="cancelSubscription(sub.id)" class="text-sm text-red-600 hover:text-red-800 font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- New Subscription Modal -->
    <div v-if="showNewModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <h3 class="text-lg font-medium text-gray-900">New Recurring Transaction</h3>
          <button @click="showNewModal = false" class="text-gray-400 hover:text-gray-500">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form @submit.prevent="submitNewSubscription" class="overflow-y-auto">
          <div class="p-6 space-y-4">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select v-model="newSubscription.type" class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option :value="2">Expense</option>
                  <option :value="1">Income</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input type="number" step="0.01" min="0.01" v-model="newSubscription.amount" required class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description (e.g., Netflix)</label>
              <input type="text" v-model="newSubscription.description" required class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Account</label>
                <select v-model="newSubscription.accountId" required class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
                </select>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Parent Category (Optional)</label>
                  <select v-model="selectedParentCategoryId" @change="handleParentChange" class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">-- None --</option>
                    <option v-for="cat in categories.filter(c => !c.parentCategoryId)" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                  </select>
                </div>
                <div v-if="selectedParentCategoryId">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                  <select v-model="newSubscription.categoryId" required class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="" disabled>-- Select Subcategory --</option>
                    <option v-for="cat in availableSubcategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select v-model="newSubscription.frequency" class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option :value="1">Daily</option>
                  <option :value="2">Weekly</option>
                  <option :value="3">Monthly</option>
                  <option :value="4">Yearly</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Start / Next Due Date</label>
                <input type="date" v-model="newSubscription.startDate" required class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>
          
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
            <button type="button" @click="showNewModal = false" class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="isSubmitting" class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center">
              Save Subscription
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
