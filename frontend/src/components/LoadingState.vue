<template>
  <div class="animate-pulse space-y-6">
    <!-- AI Summary Skeleton -->
    <div class="rounded-2xl bg-gray-100 p-6 h-64">
      <div class="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div class="space-y-3">
        <div class="h-4 bg-gray-200 rounded w-full"></div>
        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
        <div class="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>

    <!-- Event Cards Skeleton -->
    <div class="space-y-4">
      <div v-for="i in 3" :key="i" class="bg-gray-50 rounded-lg p-4 h-24">
        <div class="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
