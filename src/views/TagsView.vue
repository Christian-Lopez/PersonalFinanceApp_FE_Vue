<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import AppLayout from '../components/AppLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const tags = ref<any[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)

// UI State
const activeTab = ref<'system' | 'custom'>('system')
const showTagModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const newTag = ref({
  name: '',
  isSystem: false
})

const loadTags = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/tags')
    tags.value = response.data
  } catch (err) {
    console.error('Failed to load tags', err)
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  newTag.value = { name: '', isSystem: false }
  showTagModal.value = true
}

const openEditModal = (tag: any) => {
  isEditing.value = true
  editingId.value = tag.id
  newTag.value = {
    name: tag.name,
    isSystem: tag.isSystem
  }
  showTagModal.value = true
}

const submitTag = async () => {
  isSubmitting.value = true
  try {
    const payload = {
      name: newTag.value.name,
      isSystem: newTag.value.isSystem
    }

    if (isEditing.value && editingId.value) {
      await api.put(`/tags/${editingId.value}`, {
        id: editingId.value,
        ...payload
      })
    } else {
      await api.post('/tags', payload)
    }
    
    showTagModal.value = false
    await loadTags()
  } catch (err) {
    console.error('Failed to save tag', err)
  } finally {
    isSubmitting.value = false
  }
}

const deleteTag = async (id: string) => {
  if (!confirm("Are you sure you want to delete this tag?")) return
  
  try {
    await api.delete(`/tags/${id}`)
    await loadTags()
  } catch (err) {
    console.error('Failed to delete tag', err)
    alert("Failed to delete tag. It might be in use by transactions.")
  }
}

const displayedTags = computed(() => {
  const isSystemTab = activeTab.value === 'system'
  return tags.value.filter(t => t.isSystem === isSystemTab)
})

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  loadTags()
})
</script>

<template>
  <AppLayout>
    <div class="mb-8 flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Tags</h1>
        <p class="text-gray-500 mt-1">Organize your transactions with flexible labels.</p>
      </div>
      <button @click="openCreateModal" class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        Add Tag
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 mb-6">
      <button @click="activeTab = 'system'" class="px-6 py-3 text-sm font-medium text-center transition" :class="activeTab === 'system' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'">
        System Tags
      </button>
      <button @click="activeTab = 'custom'" class="px-6 py-3 text-sm font-medium text-center transition" :class="activeTab === 'custom' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'">
        My Tags
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="displayedTags.length === 0" class="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
      <p class="text-gray-500">No tags found for this tab.</p>
    </div>

    <!-- Tags Grid -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-wrap gap-3">
      <span v-for="tag in displayedTags" :key="tag.id" 
            class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 shadow-sm group cursor-pointer hover:bg-blue-100 hover:text-blue-800 transition-colors"
            @click="openEditModal(tag)">
        #{{ tag.name }}
        <svg class="w-3.5 h-3.5 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
      </span>
    </div>

    <!-- Modal for Tag -->
    <div v-if="showTagModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">{{ isEditing ? 'Edit Tag' : 'New Custom Tag' }}</h3>
          <button @click="showTagModal = false" class="text-gray-400 hover:text-gray-500">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form @submit.prevent="submitTag" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Tag Name</label>
            <div class="mt-1 flex rounded-md shadow-sm">
              <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                #
              </span>
              <input v-model="newTag.name" type="text" required class="flex-1 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-gray-300 p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. vacation" />
            </div>
          </div>
          
          <div class="flex items-start" v-if="!isEditing || (isEditing && newTag.isSystem)">
            <div class="flex h-5 items-center">
              <input v-model="newTag.isSystem" id="isSystemTag" type="checkbox" :disabled="isEditing && newTag.isSystem" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </div>
            <div class="ml-3 text-sm">
              <label for="isSystemTag" class="font-medium text-gray-700">Global System Tag</label>
              <p class="text-gray-500">Make this tag available to all users (Admins only).</p>
            </div>
          </div>
          
          <div class="pt-4 flex justify-between gap-3">
            <button v-if="isEditing" type="button" @click="deleteTag(editingId as string)" class="px-4 py-2 bg-white border border-rose-300 text-rose-600 rounded-md text-sm font-medium hover:bg-rose-50">
              Delete
            </button>
            <div v-else></div>
            
            <div class="flex gap-2">
              <button type="button" @click="showTagModal = false" class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
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
