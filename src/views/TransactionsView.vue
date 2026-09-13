<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import AppLayout from '../components/AppLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

// State
const accounts = ref<any[]>([])
const categories = ref<any[]>([])
const tags = ref<any[]>([])
const selectedAccount = ref<any>(null)
const transactions = ref<any[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const showNewTransactionModal = ref(false)

// Transaction vs Transfer Tab
const activeTab = ref<'transaction' | 'transfer'>('transaction')

// Transaction Creation State
const newTransaction = ref({
  amount: 0,
  type: 2, // Expense
  transactionDate: new Date().toISOString().split('T')[0],
  description: '',
  categoryId: '',
  tagIds: [] as string[]
})

// Transfer Creation State
const newTransfer = ref({
  amount: 0,
  toAccountId: '',
  transactionDate: new Date().toISOString().split('T')[0],
  description: ''
})

const loadData = async () => {
  isLoading.value = true
  try {
    const [accountsRes, categoriesRes, tagsRes] = await Promise.all([
      api.get('/accounts'),
      api.get('/categories'),
      api.get('/tags')
    ])
    
    accounts.value = accountsRes.data
    categories.value = categoriesRes.data
    tags.value = tagsRes.data
    
    if (accounts.value.length > 0) {
      if (!selectedAccount.value || !accounts.value.find(a => a.id === selectedAccount.value.id)) {
        selectedAccount.value = accounts.value[0]
      }
      await loadTransactions(selectedAccount.value.id)
    }
  } catch (err) {
    console.error('Error loading data', err)
  } finally {
    isLoading.value = false
  }
}

const isEditing = ref(false)
const editingId = ref<string | null>(null)

const handleAccountChange = async () => {
  if (selectedAccount.value) {
    await loadTransactions(selectedAccount.value.id)
  }
}

const loadTransactions = async (accountId: string) => {
  try {
    const res = await api.get(`/transactions/${accountId}`)
    transactions.value = res.data
  } catch (err) {
    console.error('Error loading transactions', err)
  }
}

// UI State
const selectedParentCategoryId = ref<string>('')
const showTags = ref(false)

const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  activeTab.value = 'transaction'
  selectedParentCategoryId.value = ''
  showTags.value = false
  newTransaction.value = {
    amount: 0,
    type: 2,
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
    tagIds: []
  }
  showNewTransactionModal.value = true
}

const openEditModal = (t: any) => {
  isEditing.value = true
  editingId.value = t.id
  activeTab.value = 'transaction' // Force standard tab for edits
  
  // Find parent category to set the first dropdown
  let parentId = ''
  if (t.categoryId) {
    const cat = categories.value.find(c => c.id === t.categoryId)
    if (cat) {
      parentId = cat.parentCategoryId ? cat.parentCategoryId : cat.id
    }
  }
  selectedParentCategoryId.value = parentId
  showTags.value = t.tags && t.tags.length > 0
  
  newTransaction.value = {
    amount: t.amount,
    type: t.type === 'Income' ? 1 : 2,
    transactionDate: t.transactionDate.split('T')[0],
    description: t.description || '',
    categoryId: t.categoryId || '',
    tagIds: t.tags ? t.tags.map((tag: any) => tag.id) : []
  }
  showNewTransactionModal.value = true
}

const toggleTag = (tagId: string) => {
  const index = newTransaction.value.tagIds.indexOf(tagId)
  if (index === -1) {
    newTransaction.value.tagIds.push(tagId)
  } else {
    newTransaction.value.tagIds.splice(index, 1)
  }
}

const submitForm = async () => {
  if (activeTab.value === 'transaction') {
    await saveTransaction()
  } else {
    await createTransfer()
  }
}

const saveTransaction = async () => {
  isSubmitting.value = true
  try {
    const payload = {
      amount: newTransaction.value.amount,
      type: newTransaction.value.type,
      transactionDate: new Date(newTransaction.value.transactionDate).toISOString(),
      description: newTransaction.value.description,
      categoryId: newTransaction.value.categoryId || null,
      tagIds: newTransaction.value.tagIds,
      accountId: selectedAccount.value.id
    }

    if (isEditing.value && editingId.value) {
      await api.put(`/transactions/${editingId.value}`, {
        id: editingId.value,
        ...payload
      })
    } else {
      await api.post('/transactions', payload)
    }
    
    showNewTransactionModal.value = false
    newTransaction.value.amount = 0
    newTransaction.value.description = ''
    newTransaction.value.categoryId = ''
    newTransaction.value.tagIds = []
    
    await loadTransactions(selectedAccount.value.id)
  } catch (err) {
    console.error('Error saving transaction', err)
  } finally {
    isSubmitting.value = false
  }
}

const deleteTransaction = async (id: string) => {
  if (!confirm("Are you sure you want to delete this transaction? This will automatically update your account balance.")) return
  
  try {
    await api.delete(`/transactions/${id}`)
    showNewTransactionModal.value = false
    await loadTransactions(selectedAccount.value.id)
  } catch (err) {
    console.error('Error deleting transaction', err)
    alert("Failed to delete transaction.")
  }
}

const createTransfer = async () => {
  if (!newTransfer.value.toAccountId || newTransfer.value.toAccountId === selectedAccount.value.id) {
    alert("Please select a valid destination account.")
    return
  }
  
  isSubmitting.value = true
  try {
    await api.post('/transactions/transfer', {
      fromAccountId: selectedAccount.value.id,
      toAccountId: newTransfer.value.toAccountId,
      amount: newTransfer.value.amount,
      transactionDate: new Date(newTransfer.value.transactionDate).toISOString(),
      description: newTransfer.value.description
    })
    
    showNewTransactionModal.value = false
    newTransfer.value.amount = 0
    newTransfer.value.description = ''
    newTransfer.value.toAccountId = ''
    
    await loadTransactions(selectedAccount.value.id)
  } catch (err) {
    console.error('Error creating transfer', err)
  } finally {
    isSubmitting.value = false
  }
}

// Helpers
const getTypeName = (type: number | string) => {
  if (type === 1 || type === 'Income') return 'Income'
  if (type === 2 || type === 'Expense') return 'Expense'
  if (type === 3 || type === 'Transfer') return 'Transfer'
  return 'Unknown'
}

const getTypeBadgeClass = (type: number | string) => {
  const name = getTypeName(type)
  if (name === 'Income') return 'bg-emerald-100 text-emerald-800'
  if (name === 'Expense') return 'bg-rose-100 text-rose-800'
  if (name === 'Transfer') return 'bg-blue-100 text-blue-800'
  return 'bg-gray-100 text-gray-800'
}

const getTypeAmountClass = (type: number | string) => {
  const name = getTypeName(type)
  if (name === 'Income') return 'text-emerald-600'
  if (name === 'Transfer') return 'text-blue-600'
  return 'text-gray-900' // Expense is default text color
}

const getAmountPrefix = (type: number | string) => {
  const name = getTypeName(type)
  if (name === 'Income') return '+'
  if (name === 'Expense') return '-'
  return ''
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  loadData()
})
</script>

<template>
  <AppLayout>
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- No Accounts View -->
    <div v-else-if="accounts.length === 0" class="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 mt-10">
      <h2 class="text-2xl font-bold text-gray-900 mb-4 text-center">No Accounts Found</h2>
      <p class="text-gray-600 mb-8 text-center">You need to create an account before you can start tracking transactions.</p>
      
      <button @click="router.push('/accounts')" class="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 font-medium transition">
        Go to Accounts
      </button>
    </div>

    <!-- Transactions View -->
    <div v-else>
      <div class="mb-8 flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Transactions</h1>
          <div class="mt-2 flex items-center gap-2">
            <span class="text-gray-500">Viewing ledger for:</span>
            <select v-model="selectedAccount" @change="handleAccountChange" class="rounded-md border-gray-300 shadow-sm text-sm py-1 pl-2 pr-8 border focus:border-blue-500 focus:ring-blue-500 font-semibold bg-white text-gray-900">
              <option v-for="acc in accounts" :key="acc.id" :value="acc">{{ acc.name }}</option>
            </select>
          </div>
        </div>
        <button @click="openCreateModal" class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Add Transaction
        </button>
      </div>

      <!-- Transactions Table -->
      <div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="transactions.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-gray-500">
                No transactions found. Click "Add Transaction" to create one.
              </td>
            </tr>
            <tr v-for="t in transactions" :key="t.id" class="hover:bg-gray-50 cursor-pointer transition-colors" @click="openEditModal(t)">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(t.transactionDate) }}</td>
              <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                {{ t.description }}
                <div v-if="t.tags && t.tags.length > 0" class="mt-1 flex flex-wrap gap-1">
                  <span v-for="tag in t.tags" :key="tag.id" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                    #{{ tag.name }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                      :class="getTypeBadgeClass(t.type)">
                  {{ getTypeName(t.type) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium"
                  :class="getTypeAmountClass(t.type)">
                {{ getAmountPrefix(t.type) }}{{ formatCurrency(t.amount) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal for New Transaction / Transfer -->
    <div v-if="showNewTransactionModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">{{ isEditing ? 'Edit Transaction' : 'New Transaction' }}</h3>
          <button @click="showNewTransactionModal = false" class="text-gray-400 hover:text-gray-500">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <!-- Tabs -->
        <div v-if="!isEditing" class="flex border-b border-gray-200 bg-gray-50">
          <button @click="activeTab = 'transaction'" class="flex-1 py-3 text-sm font-medium text-center transition" :class="activeTab === 'transaction' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'">
            Standard
          </button>
          <button @click="activeTab = 'transfer'" class="flex-1 py-3 text-sm font-medium text-center transition" :class="activeTab === 'transfer' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'">
            Transfer
          </button>
        </div>
        
        <form @submit.prevent="submitForm" class="p-6 space-y-4">
          
          <template v-if="activeTab === 'transaction'">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Type</label>
                <select v-model.number="newTransaction.type" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500">
                  <option :value="1">Income</option>
                  <option :value="2">Expense</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Amount</label>
                <input v-model.number="newTransaction.amount" type="number" step="0.01" min="0.01" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700">Main Category</label>
                <select v-model="selectedParentCategoryId" @change="newTransaction.categoryId = ''" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500">
                  <option value="">-- Select --</option>
                  <option v-for="parent in categories.filter(c => !c.parentCategoryId)" :key="parent.id" :value="parent.id">
                    {{ parent.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Subcategory</label>
                <select v-model="newTransaction.categoryId" :disabled="!selectedParentCategoryId" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50">
                  <option value="">-- None --</option>
                  <option v-for="sub in categories.filter(c => c.parentCategoryId === selectedParentCategoryId)" :key="sub.id" :value="sub.id">
                    {{ sub.name }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <div class="flex items-center">
                <input id="showTags" type="checkbox" v-model="showTags" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label for="showTags" class="ml-2 block text-sm font-medium text-gray-700">Add Tags</label>
              </div>
              
              <div v-if="showTags" class="mt-3 flex flex-wrap gap-2">
                <button type="button" v-for="tag in tags" :key="tag.id"
                        @click="toggleTag(tag.id)"
                        class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors border"
                        :class="newTransaction.tagIds.includes(tag.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'">
                  #{{ tag.name }}
                </button>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Date</label>
              <input v-model="newTransaction.transactionDate" type="date" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Description (Optional)</label>
              <input v-model="newTransaction.description" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </template>

          <template v-if="activeTab === 'transfer'">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">From</label>
                <input :value="selectedAccount?.name" disabled class="mt-1 block w-full rounded-md border-gray-200 shadow-sm p-2 border bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">To Account</label>
                <select v-model="newTransfer.toAccountId" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500">
                  <option value="" disabled>Select...</option>
                  <option v-for="acc in accounts.filter(a => a.id !== selectedAccount?.id)" :key="acc.id" :value="acc.id">
                    {{ acc.name }}
                  </option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Amount</label>
              <input v-model.number="newTransfer.amount" type="number" step="0.01" min="0.01" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Date</label>
              <input v-model="newTransfer.transactionDate" type="date" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Memo (Optional)</label>
              <input v-model="newTransfer.description" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </template>
          
          <div class="pt-4 flex justify-between gap-3">
            <button v-if="isEditing" type="button" @click="deleteTransaction(editingId as string)" class="px-4 py-2 bg-white border border-rose-300 text-rose-600 rounded-md text-sm font-medium hover:bg-rose-50">
              Delete
            </button>
            <div v-else></div> <!-- Spacer -->
            
            <div class="flex gap-2">
              <button type="button" @click="showNewTransactionModal = false" class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" :disabled="isSubmitting" class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                Save {{ activeTab === 'transfer' ? 'Transfer' : 'Transaction' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    
  </AppLayout>
</template>
