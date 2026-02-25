export interface CalendarEvent {
  id: string
  summary: string
  location?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  status: string
  htmlLink: string
}

export interface DebriefSummary {
  overview: string
  keyEvents: string[]
  insights: string[]
  timeAnalysis: string
  todo: { title: string, priority: 'high' | 'medium' | 'low', status: string }[]
}

export interface DailyDebrief {
  date: string
  events: CalendarEvent[]
  summary: DebriefSummary
  raw: string
}

export interface ApiError {
  error: string
  message?: string
}
