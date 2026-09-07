<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import AppLayout from '../components/AppLayout.vue'

// Import Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const router = useRouter()
const authStore = useAuthStore()

// State for reports
const summary = ref({ totalIncome: 0, totalExpense: 0, netSavings: 0 })
const categorySpending = ref<any[]>([])
const trendData = ref<any[]>([])

const isLoading = ref(true)
const error = ref<string | null>(null)

// For the current month
const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1 // JS months are 0-11

const loadDashboardData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const [summaryRes, categoryRes, trendRes] = await Promise.all([
      api.get(`/reports/monthly-summary?year=${currentYear}&month=${currentMonth}`),
      api.get(`/reports/category-spending?year=${currentYear}&month=${currentMonth}`),
      api.get(`/reports/trend?months=6`)
    ])
    
    summary.value = summaryRes.data
    categorySpending.value = categoryRes.data
    trendData.value = trendRes.data
  } catch (err) {
    error.value = 'Failed to load dashboard data. Are you logged in?'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// Chart Configurations
const pieChartData = computed(() => {
  return {
    labels: categorySpending.value.map(c => c.categoryName),
    datasets: [
      {
        backgroundColor: categorySpending.value.map(c => c.colorHex || '#808080'),
        data: categorySpending.value.map(c => c.totalAmount)
      }
    ]
  }
})

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          let label = context.label || '';
          if (label) { label += ': '; }
          if (context.parsed !== null) {
            label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
          }
          return label;
        }
      }
    }
  }
}

const barChartData = computed(() => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  return {
    labels: trendData.value.map(d => `${months[d.month - 1]} ${d.year}`),
    datasets: [
      {
        label: 'Income',
        backgroundColor: '#10B981', // Emerald 500
        data: trendData.value.map(d => d.totalIncome)
      },
      {
        label: 'Expenses',
        backgroundColor: '#F43F5E', // Rose 500
        data: trendData.value.map(d => d.totalExpense)
      }
    ]
  }
})

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: any) {
          return '$' + value;
        }
      }
    }
  }
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  
  loadDashboardData()
})
</script>

<template>
  <AppLayout>
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
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-32 animate-pulse flex flex-col justify-between" v-for="i in 3" :key="i">
        <div class="h-4 bg-gray-200 rounded w-1/3"></div>
        <div class="h-8 bg-gray-200 rounded w-1/2 mt-4"></div>
      </div>
    </div>

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          <p class="mt-4 text-3xl font-bold text-gray-900">{{ formatCurrency(summary.totalExpense) }}</p>
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

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        <!-- Category Expenses (Pie) -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Expenses by Category</h3>
          <div v-if="categorySpending.length > 0" class="flex-grow relative min-h-[300px]">
            <Pie :data="pieChartData" :options="pieChartOptions" />
          </div>
          <div v-else class="flex-grow flex items-center justify-center text-gray-500 min-h-[300px]">
            No expenses recorded this month.
          </div>
        </div>

        <!-- Income vs Expenses (Bar) -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h3 class="text-lg font-bold text-gray-900 mb-4">6-Month Trend</h3>
          <div v-if="trendData.length > 0" class="flex-grow relative min-h-[300px]">
            <Bar :data="barChartData" :options="barChartOptions" />
          </div>
          <div v-else class="flex-grow flex items-center justify-center text-gray-500 min-h-[300px]">
            No trend data available.
          </div>
        </div>

      </div>
    </div>
  </AppLayout>
</template>
