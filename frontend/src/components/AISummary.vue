<template>
  <div class="bg-surface border border-border rounded-2xl p-6">
    <div class="flex items-center gap-2 mb-5">
      <svg class="w-5 h-5 text-foam" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      <h2 class="text-lg font-bold text-foreground tracking-tight">AI Insights</h2>
    </div>

    <p class="text-muted leading-relaxed mb-5">
      {{ summary.overview }}
    </p>

    <div class="mb-5 flex items-center gap-2 text-sm">
      <svg class="w-4 h-4 text-foam" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="text-foreground font-medium">{{ summary.timeAnalysis }}</span>
    </div>

    <div v-if="summary.keyEvents.length > 0" class="mb-5">
      <h3 class="text-sm font-medium text-foreground mb-2">Key Events</h3>
      <ul class="space-y-1.5">
        <li 
          v-for="(event, idx) in summary.keyEvents" 
          :key="idx"
          class="flex items-start gap-2 text-sm text-muted"
        >
          <span class="text-foreground mt-0.5">—</span>
          <span>{{ event }}</span>
        </li>
      </ul>
    </div>

    <div v-if="summary.todo && summary.todo.length > 0" class="mb-5">
      <h3 class="text-sm font-medium text-foreground mb-2">Todos</h3>
      <ul class="space-y-1.5">
        <li 
          v-for="(item, idx) in summary.todo" 
          :key="idx"
          class="flex items-start gap-2 text-sm text-muted"
        >
          <span class="text-foreground mt-0.5">—</span>
          <span>{{ item }}</span>
        </li>
      </ul>
    </div>

    <div v-if="summary.insights && summary.insights.length > 0">
      <h3 class="text-sm font-medium text-foreground mb-2">Recommendations</h3>
      <div class="space-y-2">
        <div 
          v-for="(insight, idx) in summary.insights" 
          :key="idx"
          class="flex items-start gap-2 bg-background rounded-lg p-3 text-sm text-muted"
        >
          <svg class="w-4 h-4 text-foam mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ insight }}</span>
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
