<template>
  <div class="animate-pulse space-y-6">
    <!-- AI Summary Skeleton -->
    <div class="rounded-2xl bg-surface border border-border p-6 h-64">
      <div class="h-5 bg-border rounded w-1/4 mb-5"></div>
      <div class="space-y-3">
        <div class="h-4 bg-border rounded w-full"></div>
        <div class="h-4 bg-border rounded w-5/6"></div>
        <div class="h-4 bg-border rounded w-4/6"></div>
      </div>
    </div>

    <!-- Event Cards Skeleton -->
    <div class="space-y-3">
      <div v-for="i in 3" :key="i" class="bg-surface border border-border rounded-xl p-4 h-20">
        <div class="h-4 bg-border rounded w-3/4 mb-3"></div>
        <div class="h-3 bg-border rounded w-1/2"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
