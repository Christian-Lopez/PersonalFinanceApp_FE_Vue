<script setup lang="ts">
// We will add the API login logic here soon!
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="p-8 bg-white rounded-lg shadow-md w-96">
      <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">Personal Finance</h1>
      <p class="text-center text-gray-500 mb-6">Sign in to your account</p>
      
      <form @submit.prevent="" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="you@example.com" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
        </div>
        
        <button type="submit" class="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 font-medium mt-4 transition-colors">
          Log In
        </button>
      </form>
    </div>
  </div>
</template>
