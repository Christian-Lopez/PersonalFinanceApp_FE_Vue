<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex h-screen bg-gray-100 font-sans">
    
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
      <div class="h-16 flex items-center px-6 border-b border-slate-800 font-bold text-xl tracking-wider">
        FinanceApp
      </div>
      <nav class="flex-1 px-4 py-6 space-y-2">
        <router-link to="/" 
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition"
          :class="route.path === '/' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
          Dashboard
        </router-link>
        
        <router-link to="/transactions" 
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition"
          :class="route.path === '/transactions' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
          Transactions
        </router-link>
        
        <!-- Future Categories Route -->
        <a href="#" class="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition cursor-not-allowed opacity-50">
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
        <h2 class="text-xl font-semibold text-gray-800 capitalize">{{ route.name?.toString() || 'Overview' }}</h2>
        <div class="flex items-center gap-4">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
            A
          </div>
        </div>
      </header>

      <!-- Dashboard Body -->
      <div class="flex-1 overflow-auto p-8">
        <div class="max-w-6xl mx-auto">
          <!-- Slot for specific page content -->
          <slot />
        </div>
      </div>
    </main>
  </div>
</template>
