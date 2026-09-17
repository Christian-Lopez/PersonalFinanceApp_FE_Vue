<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import AppLayout from '../components/AppLayout.vue'
import api from '../lib/api'

// Setup
const router = useRouter()
const authStore = useAuthStore()

// State
const isLoading = ref(true)
const users = ref<any[]>([])
const search = ref('')

const isResetting = ref(false)
const resetPasswordUserId = ref<string | null>(null)
const newPassword = ref('')

const isChangingEmail = ref(false)
const changeEmailUserId = ref<string | null>(null)
const newEmail = ref('')

// Computed
const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const query = search.value.toLowerCase()
  return users.value.filter(u => 
    u.email.toLowerCase().includes(query) || 
    u.firstName.toLowerCase().includes(query) || 
    u.lastName.toLowerCase().includes(query)
  )
})

const stats = computed(() => {
  let activeUsers = 0
  let totalAccounts = 0
  let totalTransactions = 0
  
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  users.value.forEach(u => {
    totalAccounts += u.accountCount
    totalTransactions += u.transactionCount
    
    if (u.lastLoginAtUtc) {
      const lastLogin = new Date(u.lastLoginAtUtc)
      if (lastLogin > thirtyDaysAgo) activeUsers++
    }
  })
  
  return {
    totalUsers: users.value.length,
    activeUsers,
    totalAccounts,
    totalTransactions
  }
})

// Methods
const loadUsers = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/admin/users')
    users.value = res.data
  } catch (err) {
    console.error('Failed to load users', err)
  } finally {
    isLoading.value = false
  }
}

const toggleLock = async (user: any) => {
  if (!confirm(`Are you sure you want to ${user.isActive ? 'lock' : 'unlock'} this user?`)) return
  try {
    const res = await api.post(`/admin/users/${user.id}/toggle-lock`)
    user.isActive = res.data.isActive
  } catch (err: any) {
    alert(err.response?.data || 'Failed to toggle lock.')
  }
}

const toggleAdmin = async (user: any) => {
  if (!confirm(`Are you sure you want to ${user.isAdmin ? 'remove' : 'make'} this user an Admin?`)) return
  try {
    const res = await api.post(`/admin/users/${user.id}/toggle-admin`)
    user.isAdmin = res.data.isAdmin
  } catch (err: any) {
    alert(err.response?.data || 'Failed to toggle admin role.')
  }
}

// Password Reset Modal
const openResetModal = (id: string) => {
  resetPasswordUserId.value = id
  newPassword.value = ''
  isResetting.value = true
}

const submitResetPassword = async () => {
  try {
    await api.post(`/admin/users/${resetPasswordUserId.value}/reset-password`, { newPassword: newPassword.value })
    alert("Password reset successfully!")
    isResetting.value = false
  } catch (err: any) {
    alert(err.response?.data || 'Failed to reset password.')
  }
}

// Change Email Modal
const openEmailModal = (id: string, currentEmail: string) => {
  changeEmailUserId.value = id
  newEmail.value = currentEmail
  isChangingEmail.value = true
}

const submitChangeEmail = async () => {
  try {
    await api.post(`/admin/users/${changeEmailUserId.value}/change-email`, { newEmail: newEmail.value })
    alert("Email updated successfully!")
    isChangingEmail.value = false
    await loadUsers() // Reload to get new email in list
  } catch (err: any) {
    alert(err.response?.data || 'Failed to change email.')
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (!authStore.isAdmin) {
    router.push('/dashboard')
    return
  }
  loadUsers()
})
</script>

<template>
  <AppLayout>
    <div class="mb-6 flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p class="mt-2 text-gray-500">Manage platform users and view system health.</p>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <span class="text-gray-500 text-sm font-medium">Total Users</span>
          <span class="text-2xl font-bold text-gray-900">{{ stats.totalUsers }}</span>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <span class="text-gray-500 text-sm font-medium">Active (30 Days)</span>
          <span class="text-2xl font-bold text-gray-900">{{ stats.activeUsers }}</span>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <span class="text-gray-500 text-sm font-medium">Total Accounts</span>
          <span class="text-2xl font-bold text-gray-900">{{ stats.totalAccounts }}</span>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <span class="text-gray-500 text-sm font-medium">Total Transactions</span>
          <span class="text-2xl font-bold text-gray-900">{{ stats.totalTransactions }}</span>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 class="text-lg font-bold text-gray-900">Registered Users</h2>
          <input type="text" v-model="search" placeholder="Search by name or email..." class="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-64 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th class="p-4 font-medium">User</th>
                <th class="p-4 font-medium">Status</th>
                <th class="p-4 font-medium">Usage</th>
                <th class="p-4 font-medium">Last Login</th>
                <th class="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50">
                <td class="p-4">
                  <div class="font-medium text-gray-900">{{ user.firstName }} {{ user.lastName }}</div>
                  <div class="text-sm text-gray-500">{{ user.email }}</div>
                  <div v-if="user.isAdmin" class="mt-1 inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded">Admin</div>
                </td>
                <td class="p-4">
                  <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ user.isActive ? 'Active' : 'Locked' }}
                  </span>
                </td>
                <td class="p-4 text-sm text-gray-600">
                  {{ user.accountCount }} Acc | {{ user.transactionCount }} Tx
                </td>
                <td class="p-4 text-sm text-gray-600">
                  {{ formatDate(user.lastLoginAtUtc) }}
                </td>
                <td class="p-4 flex gap-2">
                  <button @click="toggleLock(user)" class="text-xs px-2 py-1 border rounded font-medium" :class="user.isActive ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'">
                    {{ user.isActive ? 'Lock' : 'Unlock' }}
                  </button>
                  <button @click="toggleAdmin(user)" class="text-xs px-2 py-1 border rounded font-medium" :class="user.isAdmin ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : 'text-purple-600 border-purple-200 hover:bg-purple-50'">
                    {{ user.isAdmin ? 'Demote' : 'Make Admin' }}
                  </button>
                  <button @click="openResetModal(user.id)" class="text-xs px-2 py-1 border rounded font-medium text-blue-600 border-blue-200 hover:bg-blue-50">
                    Reset Pwd
                  </button>
                  <button @click="openEmailModal(user.id, user.email)" class="text-xs px-2 py-1 border rounded font-medium text-blue-600 border-blue-200 hover:bg-blue-50">
                    Edit Email
                  </button>
                </td>
              </tr>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="5" class="p-8 text-center text-gray-500">No users found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Password Reset Modal -->
    <div v-if="isResetting" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold mb-4">Force Password Reset</h3>
        <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <input type="password" v-model="newPassword" class="w-full border-gray-300 rounded-md p-2 border focus:ring-blue-500 mb-6" />
        <div class="flex justify-end gap-3">
          <button @click="isResetting = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button @click="submitResetPassword" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Override Password</button>
        </div>
      </div>
    </div>

    <!-- Change Email Modal -->
    <div v-if="isChangingEmail" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold mb-4">Update User Email</h3>
        <label class="block text-sm font-medium text-gray-700 mb-1">New Email Address</label>
        <input type="email" v-model="newEmail" class="w-full border-gray-300 rounded-md p-2 border focus:ring-blue-500 mb-6" />
        <div class="flex justify-end gap-3">
          <button @click="isChangingEmail = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button @click="submitChangeEmail" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Update</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
