import axios from 'axios'
import type { DailyDebrief, CalendarEvent, ApiError } from '../types'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 seconds for Claude to generate summary
})

/**
 * Fetch daily debrief with AI summary
 */
export async function getDailyDebrief(date?: Date): Promise<DailyDebrief> {
  try {
    const params = date ? { date: date.toISOString().split('T')[0] } : {}
    const response = await api.get<DailyDebrief>('/debrief', { params })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiError
      throw new Error(apiError.message || apiError.error)
    }
    throw error
  }
}

/**
 * Fetch raw calendar events (faster, no AI summary)
 */
export async function getCalendarEvents(date?: Date): Promise<CalendarEvent[]> {
  try {
    const params = date ? { date: date.toISOString().split('T')[0] } : {}
    const response = await api.get<{ events: CalendarEvent[] }>('/debrief/events', { params })
    return response.data.events
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiError
      throw new Error(apiError.message || apiError.error)
    }
    throw error
  }
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<{ status: string }> {
  const response = await api.get('/health')
  return response.data
}
