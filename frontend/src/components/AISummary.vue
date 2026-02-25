<template>
  <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-100 p-6 shadow-lg">
    <!-- Decorative background -->
    <div class="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-primary-100 opacity-30 blur-2xl"></div>
    <div class="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-blue-100 opacity-30 blur-2xl"></div>
    
    <div class="relative z-10">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h2 class="text-xl font-bold text-gray-900">AI Insights</h2>
      </div>

      <!-- Overview -->
      <p class="text-gray-700 mb-4 leading-relaxed">
        {{ summary.overview }}
      </p>

      <!-- Time Analysis -->
      <div class="mb-4 flex items-center gap-2 text-sm">
        <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-gray-700 font-medium">{{ summary.timeAnalysis }}</span>
      </div>

      <!-- Key Events -->
      <div v-if="summary.keyEvents.length > 0" class="mb-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-2">Key Events</h3>
        <ul class="space-y-1">
          <li 
            v-for="(event, idx) in summary.keyEvents" 
            :key="idx"
            class="flex items-start gap-2 text-sm text-gray-600"
          >
            <span class="text-primary-500 mt-0.5">•</span>
            <span>{{ event }}</span>
          </li>
        </ul>
      </div>


      <!-- TODOS -->
      <div v-if="summary.keyEvents.length > 0" class="mb-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-2">Todos</h3>
        <ul class="space-y-1">
          <li 
            v-for="(event, idx) in summary.todo" 
            :key="idx"
            class="flex items-start gap-2 text-sm text-gray-600"
          >
            <span class="text-primary-500 mt-0.5">•</span>
            <span>{{ event }}</span>
          </li>
        </ul>
      </div>

      <!-- Insights -->
      <div v-if="summary.insights.length > 0">
        <h3 class="text-sm font-semibold text-gray-700 mb-2">Recommendations</h3>
        <div class="space-y-2">
          <div 
            v-for="(insight, idx) in summary.insights" 
            :key="idx"
            class="flex items-start gap-2 bg-white/60 rounded-lg p-2 text-sm text-gray-700"
          >
            <svg class="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ insight }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DebriefSummary } from '../types'

defineProps<{
  summary: DebriefSummary
}>()
</script>
