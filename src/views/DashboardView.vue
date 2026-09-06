<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'

const router = useRouter()
const authStore = useAuthStore()

// State for reports
const summary = ref({ totalIncome: 0, totalExpenses: 0, netSavings: 0 })
const isLoading = ref(true)
const error = ref<string | null>(null)

// For the current month
const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1 // JS months are 0-11

const loadDashboardData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const response = await api.get(`/reports/monthly-summary?year=${currentYear}&month=${currentMonth}`)
    summary.value = response.data
  } catch (err) {
    error.value = 'Failed to load dashboard data. Are you logged in?'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

onMounted(() => {
  // If not authenticated, redirect immediately
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  
  loadDashboardData()
})
</script>

<template>
  <div class="flex h-screen bg-gray-100 font-sans">
    
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
      <div class="h-16 flex items-center px-6 border-b border-slate-800 font-bold text-xl tracking-wider">
        FinanceApp
      </div>
      <nav class="flex-1 px-4 py-6 space-y-2">
        <a href="#" class="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
          Dashboard
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
          Transactions
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
          Categories
        </a>
      </nav>
      <div class="p-4 border-t border-slate-800">
        <button @click="handleLogout" class="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Log Out
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-full overflow-hidden">
      <!-- Top Header -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
        <h2 class="text-xl font-semibold text-gray-800">Overview</h2>
        <div class="flex items-center gap-4">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
            A
          </div>
        </div>
      </header>

      <!-- Dashboard Body -->
      <div class="flex-1 overflow-auto p-8">
        <div class="max-w-6xl mx-auto">
          
          <div class="mb-8 flex justify-between items-end">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p class="text-gray-500 mt-1">Your financial summary for {{ new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' }) }}</p>
            </div>
            <button @click="loadDashboardData" class="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
              Refresh
            </button>
          </div>

          <div v-if="error" class="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {{ error }}
          </div>

          <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-32 animate-pulse flex flex-col justify-between">
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              <div class="h-8 bg-gray-200 rounded w-1/2 mt-4"></div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-32 animate-pulse flex flex-col justify-between">
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              <div class="h-8 bg-gray-200 rounded w-1/2 mt-4"></div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-32 animate-pulse flex flex-col justify-between">
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              <div class="h-8 bg-gray-200 rounded w-1/2 mt-4"></div>
            </div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Income Card -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div class="flex justify-between items-start">
                <p class="text-sm font-medium text-gray-500">Total Income</p>
                <div class="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                </div>
              </div>
              <p class="mt-4 text-3xl font-bold text-gray-900">{{ formatCurrency(summary.totalIncome) }}</p>
            </div>
            
            <!-- Expenses Card -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div class="flex justify-between items-start">
                <p class="text-sm font-medium text-gray-500">Total Expenses</p>
                <div class="p-2 bg-rose-100 rounded-lg text-rose-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                </div>
              </div>
              <p class="mt-4 text-3xl font-bold text-gray-900">{{ formatCurrency(summary.totalExpenses) }}</p>
            </div>
            
            <!-- Net Savings Card -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div class="flex justify-between items-start">
                <p class="text-sm font-medium text-gray-500">Net Savings</p>
                <div class="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
              </div>
              <p class="mt-4 text-3xl font-bold" :class="summary.netSavings >= 0 ? 'text-gray-900' : 'text-rose-600'">
                {{ formatCurrency(summary.netSavings) }}
              </p>
            </div>
          </div>

          <!-- Empty state for charts -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center h-64 text-gray-400">
            <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            <p class="text-lg font-medium">Add some transactions to see your charts!</p>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>
