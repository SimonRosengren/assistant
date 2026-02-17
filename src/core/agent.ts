/**
 * Agent Core - Orchestrates Claude API calls and tool execution
 * Implements agentic loop with safety limits and execution tracing
 */

import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'node:crypto'
import type {
  Agent,
  AgentConfig,
  AgentResponse,
  AgentExecutionTrace,
  AgentIterationTrace,
  ToolExecutionTrace,
  Conversation,
  MessageParam,
  ToolUseBlock,
  Result,
  SafetyLimits,
} from '../types/index.js'
import { systemPrompt } from '../prompts/system.js'
import { tools } from '../tools/definitions.js'
import { toolRegistry } from '../tools/handlers.js'
import {
  getTotalRequestTokens,
  CLAUDE_CONTEXT_LIMIT,
  SUMMARIZATION_THRESHOLD,
  MAX_TOKENS_PER_REQUEST,
  cleanup as cleanupTokenCounter,
} from './tokenCounter.js'
import {
  loadConversation,
  saveConversation,
  createNewConversation,
} from '../storage/conversations.js'
import { saveTrace } from '../storage/traces.js'
import { applyContextManagement } from './contextManager.js'

// ============================================================================
// Constants & Defaults
// ============================================================================

const DEFAULT_SAFETY_LIMITS: SafetyLimits = {
  maxIterations: 10,
  hardTokenLimit: CLAUDE_CONTEXT_LIMIT,
  summarizationThreshold: SUMMARIZATION_THRESHOLD,
  maxTokensPerRequest: MAX_TOKENS_PER_REQUEST,
}

// Model pricing per 1M tokens (as of Feb 2026 - adjust as needed)
const MODEL_PRICING = {
  'claude-3-5-haiku-20241022': { input: 1.00, output: 5.00 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  // Add other models as needed
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculates cost in USD based on token usage and model
 */
function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING]
  if (!pricing) {
    // Unknown model, return 0
    return 0
  }
  
  const inputCost = (inputTokens / 1_000_000) * pricing.input
  const outputCost = (outputTokens / 1_000_000) * pricing.output
  return inputCost + outputCost
}

/**
 * Executes a single tool and tracks execution
 */
async function executeToolCall(
  toolUse: ToolUseBlock
): Promise<ToolExecutionTrace> {
  const startTime = new Date().toISOString()
  const startMs = performance.now()
  
  try {
    const handler = toolRegistry[toolUse.name as keyof typeof toolRegistry]
    if (!handler) {
      return {
        toolName: toolUse.name,
        startTime,
        endTime: new Date().toISOString(),
        durationMs: performance.now() - startMs,
        input: toolUse.input,
        output: {
          success: false,
          error: `Unknown tool: ${toolUse.name}`,
        },
        success: false,
      }
    }
    
    const result = await handler(toolUse.input)
    
    return {
      toolName: toolUse.name,
      startTime,
      endTime: new Date().toISOString(),
      durationMs: performance.now() - startMs,
      input: toolUse.input,
      output: result,
      success: result.success,
    }
  } catch (error) {
    return {
      toolName: toolUse.name,
      startTime,
      endTime: new Date().toISOString(),
      durationMs: performance.now() - startMs,
      input: toolUse.input,
      output: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      success: false,
    }
  }
}

// ============================================================================
// Agent Implementation
// ============================================================================

/**
 * Creates an agent instance with the provided configuration
 */
export function createAgent(config: AgentConfig): Agent {
  const client = new Anthropic({ apiKey: config.apiKey })
  const safetyLimits = config.safetyLimits || DEFAULT_SAFETY_LIMITS
  
  /**
   * Processes a user message and returns the agent's response
   */
  async function processMessage(
    userMessage: string,
    conversationId?: string
  ): Promise<Result<AgentResponse>> {
    const executionStartTime = new Date().toISOString()
    const executionStartMs = performance.now()
    const messageId = randomUUID()
    
    try {
      // 1. Load or create conversation
      let conversation: Conversation
      if (conversationId) {
        const loadResult = await loadConversation(conversationId)
        if (!loadResult.success) {
          return loadResult
        }
        conversation = loadResult.data
      } else {
        const createResult = await createNewConversation()
        if (!createResult.success) {
          return createResult
        }
        conversation = createResult.data
      }
      
      // 2. Apply context management if configured
      if (config.maxConversationTokens) {
        const contextResult = await applyContextManagement(conversation, {
          threshold: safetyLimits.summarizationThreshold,
          keepRecentCount: 20,
          apiKey: config.apiKey,
          model: config.model,
        })
        
        if (!contextResult.success) {
          return {
            success: false,
            error: new Error(
              `Context management failed: ${contextResult.error.message}. ` +
              `Please start a new conversation or reduce message history.`
            ),
          }
        }
        
        conversation = contextResult.data
      }
      
      // 3. Add user message to conversation
      const userMessageParam: MessageParam = {
        role: 'user',
        content: userMessage,
      }
      const updatedMessages = [...conversation.messages, userMessageParam]
      
      // 4. Agentic loop
      let currentMessages = updatedMessages
      const iterations: AgentIterationTrace[] = []
      let assistantResponse = ''
      let totalInputTokens = 0
      let totalOutputTokens = 0
      
      for (let i = 0; i < safetyLimits.maxIterations; i++) {
        const iterationNumber = i + 1
        const iterationTimestamp = new Date().toISOString()
        
        // Check token limit BEFORE API call
        const requestTokens = getTotalRequestTokens(
          systemPrompt,
          currentMessages,
          tools
        )
        
        if (requestTokens > safetyLimits.hardTokenLimit) {
          return {
            success: false,
            error: new Error(
              `Context size (${requestTokens} tokens) exceeds hard limit (${safetyLimits.hardTokenLimit} tokens). ` +
              `Consider starting a new conversation or enabling context summarization.`
            ),
          }
        }
        
        // Call Anthropic API
        const apiResponse = await client.messages.create({
          model: config.model,
          max_tokens: config.maxTokens || MAX_TOKENS_PER_REQUEST,
          system: systemPrompt,
          messages: currentMessages,
          tools: tools,
        })
        
        const inputTokens = apiResponse.usage.input_tokens
        const outputTokens = apiResponse.usage.output_tokens
        totalInputTokens += inputTokens
        totalOutputTokens += outputTokens
        
        // Extract text and tool uses from response
        const textBlocks = apiResponse.content.filter(
          (block): block is { type: 'text'; text: string } => block.type === 'text'
        )
        const toolUseBlocks = apiResponse.content.filter(
          (block): block is ToolUseBlock => block.type === 'tool_use'
        )
        
        // Accumulate assistant response text
        for (const textBlock of textBlocks) {
          assistantResponse += textBlock.text
        }
        
        // Execute tools if present
        const toolTraces: ToolExecutionTrace[] = []
        if (toolUseBlocks.length > 0) {
          // Add assistant message with tool uses to conversation
          currentMessages = [
            ...currentMessages,
            {
              role: 'assistant',
              content: apiResponse.content,
            },
          ]
          
          // Execute each tool
          for (const toolUse of toolUseBlocks) {
            const trace = await executeToolCall(toolUse)
            toolTraces.push(trace)
            
            // Add tool result to conversation
            currentMessages = [
              ...currentMessages,
              {
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: trace.success
                      ? JSON.stringify(trace.output.data)
                      : `Error: ${trace.output.error}`,
                  },
                ],
              },
            ]
          }
        }
        
        // Track iteration
        iterations.push({
          iterationNumber,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          toolsExecuted: toolTraces,
          stopReason: apiResponse.stop_reason || 'unknown',
          timestamp: iterationTimestamp,
        })
        
        // Break if no more tool uses
        if (toolUseBlocks.length === 0) {
          // Add final assistant message
          currentMessages = [
            ...currentMessages,
            {
              role: 'assistant',
              content: apiResponse.content,
            },
          ]
          break
        }
        
        // Check if we've hit max iterations
        if (iterationNumber === safetyLimits.maxIterations) {
          return {
            success: false,
            error: new Error(
              `Maximum iteration limit (${safetyLimits.maxIterations}) reached. ` +
              `The agent may be stuck in a tool loop.`
            ),
          }
        }
      }
      
      // 5. Build execution trace
      const executionEndTime = new Date().toISOString()
      const executionDurationMs = performance.now() - executionStartMs
      const totalTokens = totalInputTokens + totalOutputTokens
      const totalCostUsd = calculateCost(
        totalInputTokens,
        totalOutputTokens,
        config.model
      )
      
      const trace: AgentExecutionTrace = {
        conversationId: conversation.id,
        messageId,
        userMessage,
        assistantResponse,
        startTime: executionStartTime,
        endTime: executionEndTime,
        durationMs: executionDurationMs,
        totalInputTokens,
        totalOutputTokens,
        totalTokens,
        totalCostUsd,
        iterations,
        model: config.model,
      }
      
      // 6. Update conversation
      const now = new Date().toISOString()
      const updatedConversation: Conversation = {
        ...conversation,
        lastMessageAt: now,
        messages: currentMessages,
        tokenCount: getTotalRequestTokens(systemPrompt, currentMessages, tools),
      }
      
      // 7. Save conversation
      const saveResult = await saveConversation(updatedConversation)
      if (!saveResult.success) {
        return saveResult
      }
      
      // 8. Save trace
      const traceResult = await saveTrace(trace)
      if (!traceResult.success) {
        // Don't fail the whole request if trace save fails
        console.warn('Failed to save execution trace:', traceResult.error.message)
      }
      
      // 9. Return response
      return {
        success: true,
        data: {
          response: assistantResponse,
          updatedConversation,
          usage: {
            input_tokens: totalInputTokens,
            output_tokens: totalOutputTokens,
          },
          trace,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error during message processing'),
      }
    }
  }
  
  return {
    processMessage,
  }
}

/**
 * Cleanup function - call on shutdown
 */
export function cleanup(): void {
  cleanupTokenCounter()
}
