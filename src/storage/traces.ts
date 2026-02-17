/**
 * Execution Trace Storage Layer
 * Handles saving and loading execution traces for analytics and debugging
 */

import { promises as fs } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AgentExecutionTrace, Result } from '../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = join(__dirname, '../../data')
const TRACES_DIR = join(DATA_DIR, 'traces')

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Ensures the traces directory exists for a conversation
 */
async function ensureTracesDir(conversationId: string): Promise<Result<void>> {
  try {
    const dir = join(TRACES_DIR, `conversation-${conversationId}`)
    await fs.mkdir(dir, { recursive: true })
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to create traces directory'),
    }
  }
}

/**
 * Gets the file path for a trace
 */
function getTracePath(conversationId: string, timestamp: string, messageId: string): string {
  // Format: 2026-02-16T10-30-45-{messageId}.json
  const filename = `${timestamp.replace(/:/g, '-')}-${messageId}.json`
  return join(TRACES_DIR, `conversation-${conversationId}`, filename)
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Saves an execution trace to disk
 */
export async function saveTrace(trace: AgentExecutionTrace): Promise<Result<void>> {
  const dirResult = await ensureTracesDir(trace.conversationId)
  if (!dirResult.success) {
    return dirResult
  }
  
  try {
    const filePath = getTracePath(trace.conversationId, trace.startTime, trace.messageId)
    const content = JSON.stringify(trace, null, 2)
    await fs.writeFile(filePath, content, 'utf-8')
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to save trace'),
    }
  }
}

/**
 * Loads all traces for a conversation
 * Optionally filtered by date range
 */
export async function loadTraces(
  conversationId: string,
  options?: {
    startDate?: string  // ISO 8601
    endDate?: string    // ISO 8601
    limit?: number
  }
): Promise<Result<readonly AgentExecutionTrace[]>> {
  try {
    const dir = join(TRACES_DIR, `conversation-${conversationId}`)
    
    // Check if directory exists
    try {
      await fs.access(dir)
    } catch {
      // Directory doesn't exist, return empty array
      return { success: true, data: [] }
    }
    
    const files = await fs.readdir(dir)
    const traceFiles = files.filter(f => f.endsWith('.json'))
    
    // Load all traces
    const traces: AgentExecutionTrace[] = []
    for (const file of traceFiles) {
      const filePath = join(dir, file)
      const content = await fs.readFile(filePath, 'utf-8')
      const trace = JSON.parse(content) as AgentExecutionTrace
      
      // Apply date filters if provided
      if (options?.startDate && trace.startTime < options.startDate) {
        continue
      }
      if (options?.endDate && trace.startTime > options.endDate) {
        continue
      }
      
      traces.push(trace)
    }
    
    // Sort by start time (newest first)
    traces.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    
    // Apply limit if provided
    const limitedTraces = options?.limit ? traces.slice(0, options.limit) : traces
    
    return { success: true, data: limitedTraces }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to load traces'),
    }
  }
}

/**
 * Gets aggregate statistics for traces
 * If no conversationId provided, returns stats for all traces
 */
export async function getTraceStats(
  conversationId?: string
): Promise<Result<{
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  totalCost: number
  messageCount: number
  averageTokensPerMessage: number
  averageCostPerMessage: number
}>> {
  try {
    let allTraces: AgentExecutionTrace[] = []
    
    if (conversationId) {
      // Load traces for specific conversation
      const result = await loadTraces(conversationId)
      if (!result.success) {
        return result
      }
      allTraces = [...result.data]
    } else {
      // Load traces from all conversations
      const tracesDir = TRACES_DIR
      try {
        await fs.access(tracesDir)
      } catch {
        // No traces directory
        return {
          success: true,
          data: {
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalTokens: 0,
            totalCost: 0,
            messageCount: 0,
            averageTokensPerMessage: 0,
            averageCostPerMessage: 0,
          },
        }
      }
      
      const conversationDirs = await fs.readdir(tracesDir)
      for (const dir of conversationDirs) {
        if (!dir.startsWith('conversation-')) continue
        const convId = dir.replace('conversation-', '')
        const result = await loadTraces(convId)
        if (result.success) {
          allTraces.push(...result.data)
        }
      }
    }
    
    // Calculate statistics
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let totalCost = 0
    
    for (const trace of allTraces) {
      totalInputTokens += trace.totalInputTokens
      totalOutputTokens += trace.totalOutputTokens
      totalCost += trace.totalCostUsd
    }
    
    const messageCount = allTraces.length
    const totalTokens = totalInputTokens + totalOutputTokens
    const averageTokensPerMessage = messageCount > 0 ? totalTokens / messageCount : 0
    const averageCostPerMessage = messageCount > 0 ? totalCost / messageCount : 0
    
    return {
      success: true,
      data: {
        totalInputTokens,
        totalOutputTokens,
        totalTokens,
        totalCost,
        messageCount,
        averageTokensPerMessage,
        averageCostPerMessage,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to get trace statistics'),
    }
  }
}
