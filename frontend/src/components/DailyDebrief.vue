<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Daily Debrief</h1>
        <p class="text-gray-600">{{ formattedDate }}</p>
      </div>

      <!-- Loading State -->
      <LoadingState v-if="loading" />

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-red-900 mb-1">Failed to Load Debrief</h3>
            <p class="text-red-700 mb-4">{{ error }}</p>
            
            <div v-if="error.includes('Not authenticated')" class="bg-red-100 rounded p-3 mb-4 text-sm text-red-800">
              <p class="font-semibold mb-1">Authentication Required</p>
              <p>Please run the following command in your terminal:</p>
              <code class="block mt-2 bg-red-200 px-2 py-1 rounded font-mono">npm start</code>
              <p class="mt-1">Then type: <code class="bg-red-200 px-1 rounded">auth google</code></p>
            </div>
            
            <button 
              @click="retry"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>

      <!-- Success State -->
      <div v-else-if="debrief" class="space-y-6">
        <!-- AI Summary -->
        <AISummary :summary="debrief.summary" />

        <!-- Events List -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Your Schedule</h2>
          
          <div v-if="hasEvents" class="space-y-3">
            <EventCard 
              v-for="event in debrief.events" 
              :key="event.id"
              :event="event"
            />
          </div>
          
          <div v-else class="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-600 text-lg">No events scheduled for today</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDebrief } from '../composables/useDebrief'
import AISummary from './AISummary.vue'
import EventCard from './EventCard.vue'
import LoadingState from './LoadingState.vue'

const { debrief, loading, error, date, hasEvents, fetchDebrief, retry } = useDebrief()

const formattedDate = computed(() => {
  return date.value.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

onMounted(() => {
  fetchDebrief()
})
</script>
