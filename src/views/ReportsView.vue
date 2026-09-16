<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js'
import { Doughnut, Bar } from 'vue-chartjs'
import AppLayout from '../components/AppLayout.vue'
import api from '../lib/api'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement)

// State
const isLoading = ref(true)
const accounts = ref<any[]>([])

const selectedAccountId = ref<string>('')

// Default to current month range
const now = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

const startDate = ref<string>(firstDay.toISOString().split('T')[0])
const endDate = ref<string>(lastDay.toISOString().split('T')[0])

const summary = ref({
  totalIncome: 0,
  totalExpense: 0,
  netSavings: 0
})

const categorySpending = ref<any[]>([])
const trendData = ref<any[]>([])

// Chart Data Computeds
const doughnutChartData = computed(() => {
  return {
    labels: categorySpending.value.map(c => c.categoryName),
    datasets: [
      {
        backgroundColor: categorySpending.value.map(c => c.colorHex || '#CBD5E1'),
        data: categorySpending.value.map(c => c.totalAmount),
        borderWidth: 1
      }
    ]
  }
})

const barChartData = computed(() => {
  // trendData comes ordered oldest to newest from API normally, if not we could reverse it.
  // The API sends oldest to newest because of the loop: i from Months-1 down to 0.
  const labels = trendData.value.map(t => {
    const d = new Date(t.year, t.month - 1)
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  })

  return {
    labels,
    datasets: [
      {
        label: 'Income',
        backgroundColor: '#10B981', // Emerald 500
        data: trendData.value.map(t => t.totalIncome),
        borderRadius: 4
      },
      {
        label: 'Expense',
        backgroundColor: '#EF4444', // Red 500
        data: trendData.value.map(t => t.totalExpense),
        borderRadius: 4
      }
    ]
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' as const }
  }
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const }
  },
  scales: {
    y: { beginAtZero: true }
  }
}

// Data Fetching
const loadFilters = async () => {
  try {
    const res = await api.get('/accounts')
    accounts.value = res.data
  } catch (err) {
    console.error('Failed to load accounts', err)
  }
}

const loadReports = async () => {
  isLoading.value = true
  try {
    const accountQuery = selectedAccountId.value ? `&accountId=${selectedAccountId.value}` : ''
    const baseQuery = `?startDate=${startDate.value}T00:00:00Z&endDate=${endDate.value}T23:59:59Z${accountQuery}`
    
    const [summaryRes, catRes, trendRes] = await Promise.all([
      api.get(`/reports/monthly-summary${baseQuery}`),
      api.get(`/reports/category-spending${baseQuery}`),
      api.get(`/reports/trend?months=6${accountQuery}`)
    ])
    
    summary.value = summaryRes.data
    categorySpending.value = catRes.data
    trendData.value = trendRes.data
  } catch (err) {
    console.error('Failed to load reports', err)
  } finally {
    isLoading.value = false
  }
}

watch([startDate, endDate, selectedAccountId], () => {
  if (startDate.value && endDate.value) {
    loadReports()
  }
})

onMounted(async () => {
  await loadFilters()
  await loadReports()
})
</script>

<template>
  <AppLayout>
    <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
        <p class="text-gray-600">Analyze your spending and income trends.</p>
      </div>
      
      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3">
        <select v-model="selectedAccountId" class="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm">
          <option value="">All Accounts</option>
          <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
        </select>
        
        <div class="flex items-center gap-2">
          <input type="date" v-model="startDate" class="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm" />
          <span class="text-gray-500 text-sm font-medium">to</span>
          <input type="date" v-model="endDate" class="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm" />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div class="p-3 bg-green-100 text-green-600 rounded-lg">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Total Income</p>
            <p class="text-2xl font-bold text-gray-900">${{ summary.totalIncome.toFixed(2) }}</p>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div class="p-3 bg-red-100 text-red-600 rounded-lg">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Total Expense</p>
            <p class="text-2xl font-bold text-gray-900">${{ summary.totalExpense.toFixed(2) }}</p>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div class="p-3 rounded-lg" :class="summary.netSavings >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Net Savings</p>
            <p class="text-2xl font-bold text-gray-900">${{ summary.netSavings.toFixed(2) }}</p>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Category Breakdown -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-6">Expenses by Category</h3>
          <div class="h-64 relative w-full flex justify-center">
            <Doughnut v-if="categorySpending.length > 0" :data="doughnutChartData" :options="doughnutOptions" />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400">
              No expense data for this period.
            </div>
          </div>
        </div>

        <!-- 6 Month Trend -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-6">6-Month Trend</h3>
          <div class="h-64 relative w-full">
            <Bar v-if="trendData.length > 0" :data="barChartData" :options="barOptions" />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400">
              No trend data available.
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
