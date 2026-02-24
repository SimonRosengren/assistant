<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full bg-primary-500"></div>
          <h3 class="font-semibold text-gray-900">{{ event.summary }}</h3>
        </div>
        
        <div class="flex items-center gap-4 text-sm text-gray-600">
          <div class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ formattedTime }}</span>
          </div>
          
          <div v-if="event.location" class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{{ event.location }}</span>
          </div>
        </div>
      </div>
      
      <a 
        :href="event.htmlLink" 
        target="_blank" 
        rel="noopener noreferrer"
        class="text-primary-600 hover:text-primary-700 text-sm font-medium"
      >
        View
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent } from '../types'

const props = defineProps<{
  event: CalendarEvent
}>()

const formattedTime = computed(() => {
  if (props.event.start.dateTime) {
    const start = new Date(props.event.start.dateTime)
    const end = props.event.end.dateTime ? new Date(props.event.end.dateTime) : null
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
    
    if (end) {
      return `${formatTime(start)} - ${formatTime(end)}`
    }
    return formatTime(start)
  }
  
  return 'All day'
})
</script>
