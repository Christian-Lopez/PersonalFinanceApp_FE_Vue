<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import AppLayout from '../components/AppLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const categories = ref<any[]>([])
const isLoading = ref(true)

const loadCategories = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/categories')
    categories.value = response.data
  } catch (err) {
    console.error('Failed to load categories', err)
  } finally {
    isLoading.value = false
  }
}

// Group categories: Parents (parentCategoryId == null) and their children
const groupedCategories = computed(() => {
  if (!categories.value.length) return []
  
  const parents = categories.value.filter(c => !c.parentCategoryId)
  
  return parents.map(parent => {
    return {
      ...parent,
      children: categories.value.filter(c => c.parentCategoryId === parent.id)
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
})

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  loadCategories()
})
</script>

<template>
  <AppLayout>
    <div class="mb-8 flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Categories</h1>
        <p class="text-gray-500 mt-1">Manage how your transactions are grouped and tracked.</p>
      </div>
      <button class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        Add Category
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Categories Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="group in groupedCategories" :key="group.id" 
           class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        
        <!-- Parent Header -->
        <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3" 
             :style="{ borderTop: `4px solid ${group.colorHex}` }">
          <div class="w-3 h-3 rounded-full shadow-sm" :style="{ backgroundColor: group.colorHex }"></div>
          <h3 class="text-lg font-bold text-gray-900">{{ group.name }}</h3>
          <span class="ml-auto bg-gray-100 text-gray-600 text-xs py-1 px-2 rounded-full font-medium">
            {{ group.children.length }} subs
          </span>
        </div>

        <!-- Subcategories List -->
        <div class="p-5 flex-1 bg-gray-50/50">
          <div v-if="group.children.length === 0" class="text-sm text-gray-400 italic">
            No subcategories.
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span v-for="sub in group.children" :key="sub.id" 
                  class="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-white border border-gray-200 text-gray-700 shadow-sm">
              {{ sub.name }}
            </span>
          </div>
        </div>
        
      </div>
    </div>

  </AppLayout>
</template>
