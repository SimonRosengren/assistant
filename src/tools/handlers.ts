/**
 * Tool Handlers
 * Implements the execution logic for each tool
 * Handles validation, calls storage layer, and returns formatted results
 */

import type { Task, ToolExecutionResult, TaskFilter } from '../types/index.js'
import {
  createTask,
  filterTasks,
  updateTask as updateTaskStorage,
  completeTask as completeTaskStorage,
  deleteTask as deleteTaskStorage,
} from '../storage/tasks.js'

// ============================================================================
// Input Validation Helpers
// ============================================================================

/**
 * Type guard to check if value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Type guard to check if value is a valid priority
 */
function isValidPriority(value: unknown): value is 'low' | 'medium' | 'high' {
  return value === 'low' || value === 'medium' || value === 'high'
}

/**
 * Type guard to check if value is a valid task filter
 */
function isValidTaskFilter(value: unknown): value is TaskFilter {
  return value === 'all' || value === 'pending' || value === 'completed'
}

/**
 * Type guard to check if value is an object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// ============================================================================
// Tool Handlers
// ============================================================================

/**
 * Handles the add_task tool
 * Creates a new task with the provided details
 */
async function handleAddTask(input: unknown): Promise<ToolExecutionResult<Task>> {
  // Validate input is an object
  if (!isObject(input)) {
    return {
      success: false,
      error: 'Invalid input: expected an object with task details',
    }
  }

  // Validate required field: title
  if (!('title' in input) || !isNonEmptyString(input.title)) {
    return {
      success: false,
      error: 'Missing or invalid "title" field. The task title must be a non-empty string.',
    }
  }

  // Validate optional field: description
  if ('description' in input && input.description !== undefined) {
    if (typeof input.description !== 'string') {
      return {
        success: false,
        error: 'Invalid "description" field. If provided, it must be a string.',
      }
    }
  }

  // Validate optional field: priority
  if ('priority' in input && input.priority !== undefined) {
    if (!isValidPriority(input.priority)) {
      return {
        success: false,
        error: 'Invalid "priority" field. Must be one of: "low", "medium", or "high".',
      }
    }
  }

  // Call storage layer
  const result = await createTask({
    title: input.title,
    description: 'description' in input ? (input.description as string | undefined) : undefined,
    priority: 'priority' in input && input.priority !== undefined 
      ? (input.priority as 'low' | 'medium' | 'high') 
      : undefined,
  })

  // Convert Result to ToolExecutionResult
  if (!result.success) {
    return {
      success: false,
      error: `Failed to create task: ${result.error.message}`,
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

/**
 * Handles the list_tasks tool
 * Retrieves tasks with optional filtering by status
 */
async function handleListTasks(input: unknown): Promise<ToolExecutionResult<readonly Task[]>> {
  // Validate input is an object (can be empty)
  if (!isObject(input)) {
    return {
      success: false,
      error: 'Invalid input: expected an object with optional filter parameter',
    }
  }

  // Default filter to 'all' if not provided
  let filter: TaskFilter = 'all'

  // Validate optional field: filter
  if ('filter' in input && input.filter !== undefined) {
    if (!isValidTaskFilter(input.filter)) {
      return {
        success: false,
        error: 'Invalid "filter" field. Must be one of: "all", "pending", or "completed".',
      }
    }
    filter = input.filter
  }

  // Call storage layer
  const result = await filterTasks(filter)

  // Convert Result to ToolExecutionResult
  if (!result.success) {
    return {
      success: false,
      error: `Failed to retrieve tasks: ${result.error.message}`,
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

/**
 * Handles the update_task tool
 * Updates an existing task's properties
 */
async function handleUpdateTask(input: unknown): Promise<ToolExecutionResult<Task>> {
  // Validate input is an object
  if (!isObject(input)) {
    return {
      success: false,
      error: 'Invalid input: expected an object with task ID and fields to update',
    }
  }

  // Validate required field: id
  if (!('id' in input) || !isNonEmptyString(input.id)) {
    return {
      success: false,
      error: 'Missing or invalid "id" field. You must provide the UUID of the task to update.',
    }
  }

  // Validate at least one field to update is provided
  const hasUpdates = ('title' in input) || ('description' in input) || ('priority' in input)
  if (!hasUpdates) {
    return {
      success: false,
      error: 'No fields to update. Please provide at least one of: title, description, or priority.',
    }
  }

  // Validate optional field: title
  if ('title' in input && input.title !== undefined) {
    if (!isNonEmptyString(input.title)) {
      return {
        success: false,
        error: 'Invalid "title" field. If provided, it must be a non-empty string.',
      }
    }
  }

  // Validate optional field: description
  if ('description' in input && input.description !== undefined) {
    if (typeof input.description !== 'string') {
      return {
        success: false,
        error: 'Invalid "description" field. If provided, it must be a string.',
      }
    }
  }

  // Validate optional field: priority
  if ('priority' in input && input.priority !== undefined) {
    if (!isValidPriority(input.priority)) {
      return {
        success: false,
        error: 'Invalid "priority" field. Must be one of: "low", "medium", or "high".',
      }
    }
  }

  // Build updates object
  const updates: {
    title?: string
    description?: string
    priority?: 'low' | 'medium' | 'high'
    status?: 'pending' | 'completed'
    completedAt?: string
  } = {}
  
  if ('title' in input && input.title !== undefined) {
    updates.title = input.title as string
  }
  if ('description' in input && input.description !== undefined) {
    updates.description = input.description as string
  }
  if ('priority' in input && input.priority !== undefined) {
    updates.priority = input.priority as 'low' | 'medium' | 'high'
  }

  // Call storage layer
  const result = await updateTaskStorage(input.id, updates)

  // Convert Result to ToolExecutionResult
  if (!result.success) {
    return {
      success: false,
      error: `Failed to update task: ${result.error.message}`,
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

/**
 * Handles the complete_task tool
 * Marks a task as completed with timestamp
 */
async function handleCompleteTask(input: unknown): Promise<ToolExecutionResult<Task>> {
  // Validate input is an object
  if (!isObject(input)) {
    return {
      success: false,
      error: 'Invalid input: expected an object with task ID',
    }
  }

  // Validate required field: id
  if (!('id' in input) || !isNonEmptyString(input.id)) {
    return {
      success: false,
      error: 'Missing or invalid "id" field. You must provide the UUID of the task to complete.',
    }
  }

  // Call storage layer
  const result = await completeTaskStorage(input.id)

  // Convert Result to ToolExecutionResult
  if (!result.success) {
    return {
      success: false,
      error: `Failed to complete task: ${result.error.message}`,
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

/**
 * Handles the delete_task tool
 * Permanently removes a task from storage
 */
async function handleDeleteTask(input: unknown): Promise<ToolExecutionResult<string>> {
  // Validate input is an object
  if (!isObject(input)) {
    return {
      success: false,
      error: 'Invalid input: expected an object with task ID',
    }
  }

  // Validate required field: id
  if (!('id' in input) || !isNonEmptyString(input.id)) {
    return {
      success: false,
      error: 'Missing or invalid "id" field. You must provide the UUID of the task to delete.',
    }
  }

  // Call storage layer
  const result = await deleteTaskStorage(input.id)

  // Convert Result to ToolExecutionResult
  if (!result.success) {
    return {
      success: false,
      error: `Failed to delete task: ${result.error.message}`,
    }
  }

  return {
    success: true,
    data: `Task ${input.id} has been successfully deleted.`,
  }
}

import { google } from 'googleapis'
import { getAuthenticatedGoogleClient } from '../auth/googleAuth.js'

/**
 * Type guard to check if value is a valid calendar order by option
 */
function isValidCalendarOrderBy(value: unknown): value is 'startTime' | 'updated' {
  return value === 'startTime' || value === 'updated'
}

/**
 * Handles the read_calendar_events tool
 * Retrieves events from a Google Calendar
 */
async function handleReadCalendarEvents(input: unknown): Promise<ToolExecutionResult<any>> {
  // Validate input is an object
  if (!isObject(input)) {
    return {
      success: false,
      error: 'Invalid input: expected an object with calendar event details',
    }
  }

  const { calendarId = 'primary', timeMin, timeMax, maxResults = 10, orderBy = 'startTime', singleEvents = true } = input as any

  // Validate calendarId
  if (!isNonEmptyString(calendarId)) {
    return {
      success: false,
      error: 'Invalid "calendarId" field. It must be a non-empty string.',
    }
  }

  // Validate timeMin and timeMax if provided
  if (timeMin !== undefined && typeof timeMin !== 'string') {
    return {
      success: false,
      error: 'Invalid "timeMin" field. If provided, it must be a string (ISO 8601 format).',
    }
  }
  if (timeMax !== undefined && typeof timeMax !== 'string') {
    return {
      success: false,
      error: 'Invalid "timeMax" field. If provided, it must be a string (ISO 8601 format).',
    }
  }

  // Validate maxResults
  if (typeof maxResults !== 'number' || maxResults <= 0) {
    return {
      success: false,
      error: 'Invalid "maxResults" field. It must be a positive number.',
    }
  }

  // Validate orderBy
  if (!isValidCalendarOrderBy(orderBy)) {
    return {
      success: false,
      error: 'Invalid "orderBy" field. Must be one of: "startTime", "updated".',
    }
  }

  // Validate singleEvents
  if (typeof singleEvents !== 'boolean') {
    return {
      success: false,
      error: 'Invalid "singleEvents" field. It must be a boolean.',
    }
  }

  const authClientResult = await getAuthenticatedGoogleClient()
  if (!authClientResult.success) {
    return {
      success: false,
      error: `Authentication error: ${authClientResult.error.message}`,
    }
  }
  const auth = authClientResult.data
  const calendar = google.calendar({ version: 'v3', auth })

  try {
    // Set default time range if not provided
    const now = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(now.getDate() + 7)

    const eventsResult = await calendar.events.list({
      calendarId,
      timeMin: timeMin || now.toISOString(),
      timeMax: timeMax || sevenDaysFromNow.toISOString(),
      maxResults,
      singleEvents,
      orderBy,
    })

    const events = eventsResult.data.items || []

    return {
      success: true,
      data: events.map((event) => ({
        id: event.id,
        summary: event.summary,
        location: event.location,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        status: event.status,
        htmlLink: event.htmlLink,
      })),
    }
  } catch (error: any) {
    console.error('Failed to retrieve calendar events:', error.message)
    // Attempt to provide more specific error messages for common issues
    if (error.code === 401 || error.code === 403) {
      return {
        success: false,
        error: 'Permission denied or authentication expired. Please re-authenticate.',
      }
    }
    if (error.code === 404) {
      return {
        success: false,
        error: `Calendar with ID "${calendarId}" not found.`,
      }
    }
    return {
      success: false,
      error: `Failed to retrieve calendar events: ${error.message || 'Unknown error'}`,
    }
  }
}

// ============================================================================
// Tool Registry
// ============================================================================

/**
 * Maps tool names to their handler functions
 * Used by the agent core to execute tools
 */
export const toolRegistry = {
  add_task: handleAddTask,
  list_tasks: handleListTasks,
  update_task: handleUpdateTask,
  complete_task: handleCompleteTask,
  delete_task: handleDeleteTask,
  read_calendar_events: handleReadCalendarEvents,
} as const


/**
 * Type-safe tool name union
 */
export type ToolName = keyof typeof toolRegistry
