/**
 * Context Manager
 * Handles conversation summarization when approaching token limits
 */

import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam, SummaryMetadata, Conversation, Result, Model } from '../types/index.js'
import { countMessageTokens } from './tokenCounter.js'

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Checks if conversation needs summarization
 */
export function needsSummarization(
  conversation: Conversation,
  threshold: number
): boolean {
  const tokenCount = conversation.tokenCount || 0
  return tokenCount >= threshold
}

/**
 * Summarizes old messages, keeping recent ones intact
 * Returns new message array with summary prepended
 */
export async function summarizeOldMessages(
  messages: readonly MessageParam[],
  keepRecentCount: number,
  apiKey: string,
  model: Model
): Promise<Result<{
  summarizedMessages: readonly MessageParam[]
  metadata: SummaryMetadata
}>> {
  if (messages.length <= keepRecentCount) {
    // Not enough messages to summarize
    return {
      success: false,
      error: new Error('Not enough messages to summarize'),
    }
  }
  
  try {
    // Split messages
    const oldMessages = messages.slice(0, -keepRecentCount)
    const recentMessages = messages.slice(-keepRecentCount)
    
    // Count tokens before summarization
    const tokenCountBefore = countMessageTokens(messages)
    
    // Build conversation text for summarization
    let conversationText = ''
    for (const msg of oldMessages) {
      const role = msg.role === 'user' ? 'User' : 'Assistant'
      if (typeof msg.content === 'string') {
        conversationText += `${role}: ${msg.content}\n\n`
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if ('text' in block) {
            conversationText += `${role}: ${block.text}\n\n`
          }
        }
      }
    }
    
    // Call Claude to generate summary
    const client = new Anthropic({ apiKey })
    const summaryResponse = await client.messages.create({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content:
            `Please provide a concise summary of the following conversation. ` +
            `Focus on key topics discussed, decisions made, and important context. ` +
            `Keep it brief but comprehensive.\n\n${conversationText}`,
        },
      ],
    })
    
    const summaryText = summaryResponse.content
      .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
      .map(block => block.text)
      .join('\n')
    
    // Create summary message (as user message with special marker)
    const summaryMessage: MessageParam = {
      role: 'user',
      content: `[Previous conversation summary: ${summaryText}]`,
    }
    
    // Build new message array
    const summarizedMessages = [summaryMessage, ...recentMessages]
    
    // Count tokens after summarization
    const tokenCountAfter = countMessageTokens(summarizedMessages)
    
    // Build metadata
    const metadata: SummaryMetadata = {
      summarizedAt: new Date().toISOString(),
      originalMessageCount: messages.length,
      messagesKept: keepRecentCount,
      tokenCountBefore,
      tokenCountAfter,
    }
    
    return {
      success: true,
      data: {
        summarizedMessages,
        metadata,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to summarize messages'),
    }
  }
}

/**
 * Applies context management to a conversation if needed
 * Returns updated conversation or original if no action needed
 */
export async function applyContextManagement(
  conversation: Conversation,
  config: {
    threshold: number
    keepRecentCount: number
    apiKey: string
    model: Model
  }
): Promise<Result<Conversation>> {
  // Check if summarization is needed
  if (!needsSummarization(conversation, config.threshold)) {
    // No action needed
    return { success: true, data: conversation }
  }
  
  // Perform summarization
  const result = await summarizeOldMessages(
    conversation.messages,
    config.keepRecentCount,
    config.apiKey,
    config.model
  )
  
  if (!result.success) {
    return result
  }
  
  // Update conversation
  const updatedConversation: Conversation = {
    ...conversation,
    messages: result.data.summarizedMessages,
    tokenCount: result.data.metadata.tokenCountAfter,
    summaries: [
      ...(conversation.summaries || []),
      result.data.metadata,
    ],
  }
  
  return { success: true, data: updatedConversation }
}
