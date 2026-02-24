import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { DailyDebrief } from '../types'
import { getDailyDebrief } from '../api/client'

export function useDebrief(initialDate?: Date) {
  const debrief: Ref<DailyDebrief | null> = ref(null)
  const loading = ref(false)
  const error: Ref<string | null> = ref(null)
  const date = ref(initialDate || new Date())

  const hasEvents = computed(() => {
    return debrief.value && debrief.value.events.length > 0
  })

  const fetchDebrief = async (newDate?: Date) => {
    if (newDate) {
      date.value = newDate
    }

    loading.value = true
    error.value = null

    try {
      debrief.value = await getDailyDebrief(date.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load debrief'
      console.error('Error fetching debrief:', err)
    } finally {
      loading.value = false
    }
  }

  const retry = () => {
    fetchDebrief()
  }

  return {
    debrief,
    loading,
    error,
    date,
    hasEvents,
    fetchDebrief,
    retry,
  }
}
