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

// UI State
const activeTab = ref<'system' | 'custom'>('system')
const showCategoryModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const newCategory = ref({
  name: '',
  colorHex: '#3B82F6',
  parentCategoryId: '',
  isSystem: false
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

const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  newCategory.value = { name: '', colorHex: '#3B82F6', parentCategoryId: '', isSystem: false }
  showCategoryModal.value = true
}

const openEditModal = (category: any) => {
  if (category.isSystem && !authStore.isAdmin) return;

  isEditing.value = true
  editingId.value = category.id
  newCategory.value = {
    name: category.name,
    colorHex: category.colorHex || '#3B82F6',
    parentCategoryId: category.parentCategoryId || '',
    isSystem: category.isSystem
  }
  showCategoryModal.value = true
}

const handleParentChange = () => {
  if (newCategory.value.parentCategoryId) {
    const parent = categories.value.find(c => c.id === newCategory.value.parentCategoryId)
    if (parent && parent.colorHex) {
      newCategory.value.colorHex = parent.colorHex
    }
  }
}

const submitCategory = async () => {
  isSubmitting.value = true
  try {
    const payload = {
      name: newCategory.value.name,
      colorHex: newCategory.value.colorHex,
      parentCategoryId: newCategory.value.parentCategoryId || null,
      isSystem: newCategory.value.isSystem
    }

    if (isEditing.value && editingId.value) {
      await api.put(`/categories/${editingId.value}`, {
        id: editingId.value,
        ...payload
      })
    } else {
      await api.post('/categories', payload)
    }
    
    showCategoryModal.value = false
    await loadCategories()
  } catch (err) {
    console.error('Failed to save category', err)
  } finally {
    isSubmitting.value = false
  }
}

const deleteCategory = async (id: string) => {
  if (!confirm("Are you sure you want to delete this category?")) return
  
  try {
    await api.delete(`/categories/${id}`)
    await loadCategories()
  } catch (err) {
    console.error('Failed to delete category', err)
    alert("Failed to delete category. It might be in use by transactions.")
  }
}

// Group categories based on active tab
const groupedCategories = computed(() => {
  if (!categories.value.length) return []
  
  const isSystemTab = activeTab.value === 'system'
  const filtered = categories.value.filter(c => c.isSystem === isSystemTab)
  
  const parents = filtered.filter(c => !c.parentCategoryId)
  
  return parents.map(parent => {
    return {
      ...parent,
      children: filtered.filter(c => c.parentCategoryId === parent.id).sort((a, b) => a.name.localeCompare(b.name))
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
      <button @click="openCreateModal" class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        Add Category
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 mb-6">
      <button @click="activeTab = 'system'" class="px-6 py-3 text-sm font-medium text-center transition" :class="activeTab === 'system' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'">
        System Categories
      </button>
      <button @click="activeTab = 'custom'" class="px-6 py-3 text-sm font-medium text-center transition" :class="activeTab === 'custom' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'">
        My Categories
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="groupedCategories.length === 0" class="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
      <p class="text-gray-500">No categories found for this tab.</p>
    </div>

    <!-- Categories Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="group in groupedCategories" :key="group.id" 
           class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group/card">
        
        <!-- Parent Header -->
        <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3 relative" 
             :style="{ borderTop: `4px solid ${group.colorHex}` }">
          <div class="w-3 h-3 rounded-full shadow-sm" :style="{ backgroundColor: group.colorHex }"></div>
          <h3 class="text-lg font-bold text-gray-900">{{ group.name }}</h3>
          <span class="ml-auto bg-gray-100 text-gray-600 text-xs py-1 px-2 rounded-full font-medium">
            {{ group.children.length }} subs
          </span>
          <!-- Edit Button for Parent -->
          <button v-if="!group.isSystem || authStore.isAdmin" @click="openEditModal(group)" class="absolute right-2 top-2 p-1 text-gray-300 hover:text-blue-600 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
        </div>

        <!-- Subcategories List -->
        <div class="p-5 flex-1 bg-gray-50/50">
          <div v-if="group.children.length === 0" class="text-sm text-gray-400 italic">
            No subcategories.
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span v-for="sub in group.children" :key="sub.id" 
                  class="inline-flex items-center px-2.5 py-1.5 rounded-md text-sm font-medium bg-white border border-gray-200 text-gray-700 shadow-sm group/pill"
                  :class="!sub.isSystem || authStore.isAdmin ? 'cursor-pointer hover:border-blue-300' : 'cursor-default'"
                  @click="openEditModal(sub)">
              <div v-if="sub.colorHex !== group.colorHex" class="w-2 h-2 rounded-full mr-1.5" :style="{ backgroundColor: sub.colorHex }"></div>
              {{ sub.name }}
              <svg v-if="!sub.isSystem || authStore.isAdmin" class="w-3 h-3 ml-1.5 text-gray-300 opacity-0 group-hover/pill:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </span>
          </div>
        </div>
        
      </div>
    </div>

    <!-- Modal for Category -->
    <div v-if="showCategoryModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">{{ isEditing ? 'Edit Category' : 'New Custom Category' }}</h3>
          <button @click="showCategoryModal = false" class="text-gray-400 hover:text-gray-500">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form @submit.prevent="submitCategory" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Category Name</label>
            <input v-model="newCategory.name" type="text" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. Sushi" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Color</label>
              <div class="mt-1 flex items-center gap-2">
                <input v-model="newCategory.colorHex" type="color" required class="h-9 w-9 rounded border border-gray-300 cursor-pointer" />
                <span class="text-sm font-mono text-gray-500">{{ newCategory.colorHex.toUpperCase() }}</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Parent Category</label>
              <select v-model="newCategory.parentCategoryId" @change="handleParentChange" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500">
                <option value="">-- Main Category --</option>
                <option v-for="parent in categories.filter(c => !c.parentCategoryId)" :key="parent.id" :value="parent.id">
                  {{ parent.name }} ({{ parent.isSystem ? 'System' : 'Custom' }})
                </option>
              </select>
            </div>
          </div>
          
          <div class="flex items-start" v-if="!isEditing || (isEditing && newCategory.isSystem)">
            <div class="flex h-5 items-center">
              <input v-model="newCategory.isSystem" id="isSystem" type="checkbox" :disabled="isEditing && newCategory.isSystem" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </div>
            <div class="ml-3 text-sm">
              <label for="isSystem" class="font-medium text-gray-700">Global System Category</label>
              <p class="text-gray-500">Make this category available to all users (Admins only).</p>
            </div>
          </div>
          
          <div class="pt-4 flex justify-between gap-3">
            <button v-if="isEditing" type="button" @click="deleteCategory(editingId as string)" class="px-4 py-2 bg-white border border-rose-300 text-rose-600 rounded-md text-sm font-medium hover:bg-rose-50">
              Delete
            </button>
            <div v-else></div> <!-- Spacer -->
            
            <div class="flex gap-2">
              <button type="button" @click="showCategoryModal = false" class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" :disabled="isSubmitting" class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

  </AppLayout>
</template>
