/**
 * Debrief Service - Generates intelligent daily debriefs using calendar events and Claude
 */

import { createAgent } from '../../core/agent.js'
import type { AgentConfig } from '../../types/index.js'
import { toolRegistry } from '../../tools/handlers.js'

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
}

export interface DailyDebrief {
  date: string
  events: CalendarEvent[]
  summary: DebriefSummary
  raw: string
}

/**
 * Fetches calendar events for a given date
 */
async function fetchCalendarEvents(date: Date): Promise<CalendarEvent[]> {
  // Set time range for the entire day
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const result = await toolRegistry.read_calendar_events({
    calendarId: 'primary',
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    maxResults: 50,
    orderBy: 'startTime',
    singleEvents: true,
  })

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch calendar events')
  }
  console.log(result)
  return result.data || []
}

/**
 * Generates an AI summary of the day using Claude
 */
async function generateAISummary(
  date: Date,
  events: CalendarEvent[]
): Promise<{ summary: DebriefSummary; raw: string }> {
  if (events.length === 0) {
    return {
      summary: {
        overview: "You have a free day with no scheduled events.",
        keyEvents: [],
        insights: ["Consider using this time for focused work or personal activities."],
        timeAnalysis: "No scheduled events today."
      },
      raw: "No events scheduled for today."
    }
  }

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.MODEL;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not found in environment variables')
  }

  // Format events for Claude
  const eventsText = events
    .map((event, idx) => {
      const startTime = event.start.dateTime 
        ? new Date(event.start.dateTime).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })
        : 'All day'
      
      const endTime = event.end.dateTime
        ? new Date(event.end.dateTime).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })
        : ''

      const timeRange = endTime ? `${startTime} - ${endTime}` : startTime
      const location = event.location ? ` (${event.location})` : ''
      
      return `${idx + 1}. ${timeRange}: ${event.summary}${location}`
    })
    .join('\n')

  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  const prompt = `You are analyzing a user's calendar for ${dateStr}. Here are their scheduled events:

${eventsText}

Please provide a concise, friendly daily debrief. Respond with a JSON object containing:
- "overview": A brief 1-2 sentence overview of their day
- "keyEvents": An array of 2-4 most important events (just the titles/descriptions)
- "insights": An array of 1-3 helpful insights or patterns you notice (e.g., back-to-back meetings, travel time needed, prep suggestions)
- "timeAnalysis": A brief sentence about their schedule density (e.g., "A busy day with 6 meetings" or "A light schedule with plenty of focus time")

Keep the tone friendly, professional, and helpful. Focus on what matters most.

Return ONLY valid JSON, no other text.`

  try {
    // Create agent with config
    const config: AgentConfig = {
      apiKey,
      model: model || 'claude-3-5-haiku-20241022',
      maxTokens: 1024,
    }
    
    const agent = createAgent(config)
    
    // Process message through agent
    const result = await agent.processMessage(prompt)
    
    if (!result.success) {
      throw new Error(result.error.message)
    }

    const rawText = result.data.response
    
    // Try to parse JSON response
    try {
      const summary = JSON.parse(rawText) as DebriefSummary
      return { summary, raw: rawText }
    } catch (parseError) {
      // If JSON parsing fails, create a simple summary from the raw text
      return {
        summary: {
          overview: rawText.slice(0, 200),
          keyEvents: events.slice(0, 3).map(e => e.summary),
          insights: ["Review your calendar for the full details."],
          timeAnalysis: `${events.length} events scheduled today.`
        },
        raw: rawText
      }
    }
  } catch (error) {
    console.error('Error generating AI summary:', error)
    throw new Error('Failed to generate AI summary')
  }
}

/**
 * Generates a complete daily debrief for the specified date
 */
export async function generateDailyDebrief(date: Date = new Date()): Promise<DailyDebrief> {
  try {
    // Fetch calendar events
    const events = await fetchCalendarEvents(date)
    
    // Generate AI summary
    const { summary, raw } = await generateAISummary(date, events)
    
    return {
      date: date.toISOString(),
      events,
      summary,
      raw,
    }
  } catch (error) {
    console.error('Error generating daily debrief:', error)
    throw error
  }
}

/**
 * Gets raw calendar events without AI summary (faster)
 */
export async function getCalendarEvents(date: Date = new Date()): Promise<CalendarEvent[]> {
  return fetchCalendarEvents(date)
}
