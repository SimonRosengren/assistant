/**
 * Token counting utilities using tiktoken
 * Provides accurate token counts for Claude models
 */

import { Tiktoken, encoding_for_model } from 'tiktoken'
import type { MessageParam, Tool } from '../types/index.js'

// ============================================================================
// Constants
// ============================================================================

export const CLAUDE_CONTEXT_LIMIT = 200_000
export const SUMMARIZATION_THRESHOLD = 150_000  // 75% of limit
export const MAX_TOKENS_PER_REQUEST = 4096

// Claude uses cl100k_base encoding (same as GPT-4)
let encoder: Tiktoken | null = null

function getEncoder(): Tiktoken {
  if (!encoder) {
    encoder = encoding_for_model('gpt-4') // Claude uses same encoding
  }
  return encoder
}

// ============================================================================
// Core Counting Functions
// ============================================================================

/**
 * Counts tokens in a text string
 */
export function countTokens(text: string): number {
  if (!text) return 0
  const enc = getEncoder()
  const tokens = enc.encode(text)
  return tokens.length
}

/**
 * Counts tokens in an array of messages
 * Includes message formatting overhead
 */
export function countMessageTokens(messages: readonly MessageParam[]): number {
  let total = 0
  
  for (const message of messages) {
    // Add overhead for message role
    total += 4 // Approximate overhead per message
    
    // Count role
    total += countTokens(message.role)
    
    // Count content
    if (typeof message.content === 'string') {
      total += countTokens(message.content)
    } else if (Array.isArray(message.content)) {
      for (const block of message.content) {
        if ('text' in block) {
          total += countTokens(block.text)
        } else if ('tool_use_id' in block) {
          // Tool result block
          total += countTokens(block.tool_use_id)
          if (typeof block.content === 'string') {
            total += countTokens(block.content)
          }
        }
      }
    }
  }
  
  return total
}

/**
 * Estimates tokens for tool definitions
 * Tool schemas add overhead to context
 */
export function countToolTokens(tools: readonly Tool[]): number {
  let total = 0
  
  for (const tool of tools) {
    // Count tool name, description, and schema
    total += countTokens(tool.name)
    total += countTokens(tool.description || '')
    total += countTokens(JSON.stringify(tool.input_schema))
    total += 10 // Formatting overhead per tool
  }
  
  return total
}

/**
 * Gets total tokens for a complete API request
 * Includes system prompt, messages, and tools
 */
export function getTotalRequestTokens(
  systemPrompt: string,
  messages: readonly MessageParam[],
  tools: readonly Tool[]
): number {
  const systemTokens = countTokens(systemPrompt)
  const messageTokens = countMessageTokens(messages)
  const toolTokens = countToolTokens(tools)
  
  return systemTokens + messageTokens + toolTokens
}

/**
 * Cleanup function for encoder (call on shutdown)
 */
export function cleanup(): void {
  if (encoder) {
    encoder.free()
    encoder = null
  }
}
