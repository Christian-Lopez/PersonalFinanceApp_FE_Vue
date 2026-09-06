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
const isSubmitting = ref(false)
const showNewCategoryModal = ref(false)

const newCategory = ref({
  name: '',
  colorHex: '#3B82F6',
  parentCategoryId: ''
})

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

const createCategory = async () => {
  isSubmitting.value = true
  try {
    await api.post('/categories', {
      name: newCategory.value.name,
      colorHex: newCategory.value.colorHex,
      parentCategoryId: newCategory.value.parentCategoryId || null
    })
    
    showNewCategoryModal.value = false
    newCategory.value = { name: '', colorHex: '#3B82F6', parentCategoryId: '' }
    
    await loadCategories()
  } catch (err) {
    console.error('Failed to create category', err)
  } finally {
    isSubmitting.value = false
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
      <button @click="showNewCategoryModal = true" class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
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
              <div v-if="sub.colorHex !== group.colorHex" class="w-2 h-2 rounded-full mr-1.5" :style="{ backgroundColor: sub.colorHex }"></div>
              {{ sub.name }}
            </span>
          </div>
        </div>
        
      </div>
    </div>

    <!-- Modal for New Category -->
    <div v-if="showNewCategoryModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">New Custom Category</h3>
          <button @click="showNewCategoryModal = false" class="text-gray-400 hover:text-gray-500">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form @submit.prevent="createCategory" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Category Name</label>
            <input v-model="newCategory.name" type="text" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. Sushi" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Color</label>
              <div class="mt-1 flex items-center gap-2">
                <input v-model="newCategory.colorHex" type="color" required class="h-9 w-9 rounded border border-gray-300 cursor-pointer" />
                <span class="text-sm font-mono text-gray-500">{{ newCategory.colorHex.toUpperCase() }}</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Parent Category</label>
              <select v-model="newCategory.parentCategoryId" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500">
                <option value="">-- Main Category --</option>
                <option v-for="parent in groupedCategories" :key="parent.id" :value="parent.id">{{ parent.name }}</option>
              </select>
            </div>
          </div>
          
          <div class="pt-4 flex justify-end gap-3">
            <button type="button" @click="showNewCategoryModal = false" class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="isSubmitting" class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              Save Category
            </button>
          </div>
        </form>
      </div>
    </div>

  </AppLayout>
</template>
