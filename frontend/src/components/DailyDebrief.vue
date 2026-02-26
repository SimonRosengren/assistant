<template>
  <div class="min-h-screen bg-background py-12 px-4">
    <div class="max-w-3xl mx-auto">
      <!-- Header with geometric element -->
      <header class="mb-12">
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-4xl font-bold text-foreground tracking-tight mb-1">Daily Debrief</h1>
            <p class="text-muted text-sm font-medium">{{ formattedDate }}</p>
          </div>
        </div>
      </header>

      <!-- Loading State -->
      <LoadingState v-if="loading" />

      <!-- Error State -->
      <div v-else-if="error" class="bg-surface border border-border rounded-xl p-6">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-love flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-foreground mb-1">Failed to Load Debrief</h3>
            <p class="text-muted mb-4">{{ error }}</p>
            
            <div v-if="error.includes('Not authenticated')" class="bg-background rounded-lg p-4 mb-4 text-sm">
              <p class="font-medium mb-1">Authentication Required</p>
              <p class="text-muted mb-2">Please run the following in your terminal:</p>
              <code class="block bg-surface border border-border px-3 py-2 rounded-lg font-mono text-xs">npm start</code>
              <p class="mt-2 text-muted">Then type: <code class="bg-surface border border-border px-1 rounded text-xs">auth google</code></p>
            </div>
            
            <button 
              @click="retry"
              class="bg-foreground hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
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
          <h2 class="text-xl font-bold text-foreground tracking-tight mb-4">Your Schedule</h2>
          
          <div v-if="hasEvents" class="space-y-3">
            <EventCard 
              v-for="event in debrief.events" 
              :key="event.id"
              :event="event"
            />
          </div>
          
          <div v-else class="bg-surface border border-border rounded-xl p-12 text-center">
            <div class="w-12 h-12 mx-auto mb-4 border border-border rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="text-muted">No events scheduled for today</p>
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
