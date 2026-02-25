/**
 * Debrief Routes - REST endpoints for daily debrief functionality
 */

import { Router, Request, Response } from 'express'
import { generateDailyDebrief, getCalendarEvents } from '../services/debriefService.js'

const router = Router()

/**
 * GET /api/debrief
 * Returns a complete daily debrief with AI summary
 * Query params:
 *   - date: ISO date string (optional, defaults to today)
 */
router.get('/debrief', async (req: Request, res: Response) => {
  try {
    const dateParam = req.query.date as string | undefined
    const date = dateParam ? new Date(dateParam) : new Date()
    
    if (isNaN(date.getTime())) {
      res.status(400).json({
        error: 'Invalid date parameter. Use ISO 8601 format (e.g., 2024-02-23)',
      })
      return
    }

    const debrief = await generateDailyDebrief(date)
    res.json(debrief)
  } catch (error) {
    console.error('Error generating debrief:', error)
    
    if (error instanceof Error) {
      // Check for authentication errors
      if (error.message.includes('authentication') || error.message.includes('401')) {
        res.status(401).json({
          error: 'Not authenticated with Google Calendar',
          message: 'Please run "auth google" in the CLI first',
        })
        return
      }
    }
    
    res.status(500).json({
      error: 'Failed to generate daily debrief',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/debrief/events
 * Returns raw calendar events without AI summary (faster)
 * Query params:
 *   - date: ISO date string (optional, defaults to today)
 */
router.get('/debrief/events', async (req: Request, res: Response) => {
  try {
    const dateParam = req.query.date as string | undefined
    const date = dateParam ? new Date(dateParam) : new Date()
    
    // Validate date
    if (isNaN(date.getTime())) {
      res.status(400).json({
        error: 'Invalid date parameter. Use ISO 8601 format (e.g., 2024-02-23)',
      })
      return
    }

    const events = await getCalendarEvents(date)
    res.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('authentication') || error.message.includes('401')) {
        res.status(401).json({
          error: 'Not authenticated with Google Calendar',
          message: 'Please run "auth google" in the CLI first',
        })
        return
      }
    }
    
    res.status(500).json({
      error: 'Failed to fetch calendar events',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
