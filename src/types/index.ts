/**
 * Core type definitions for the Personal Assistant Agent
 * All types use readonly properties for immutability
 * 
 * We import message/tool types from the Anthropic SDK to stay in sync
 * and only define application-specific types here.
 */

// ============================================================================
// Anthropic SDK Type Imports
// ============================================================================

import type {
  MessageParam,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ToolResultBlockParam,
  Tool,
  Model,
  Usage,
} from '@anthropic-ai/sdk/resources/messages.js'

// Re-export SDK types for convenience
export type {
  MessageParam,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ToolResultBlockParam,
  Tool,
  Model,
  Usage,
}

// ============================================================================
// Result Type - Used for error handling throughout the application
// ============================================================================

export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E }

// ============================================================================
// Task Types
// ============================================================================

export type TaskStatus = 'pending' | 'completed'

export type TaskPriority = 'low' | 'medium' | 'high'

export type Task = {
  readonly id: string
  readonly title: string
  readonly description?: string
  readonly priority: TaskPriority
  readonly status: TaskStatus
  readonly createdAt: string
  readonly completedAt?: string
}

export type TaskFilter = 'all' | 'pending' | 'completed'

export type CreateTaskInput = {
  readonly title: string
  readonly description?: string
  readonly priority?: TaskPriority
}

// ============================================================================
// Tool System Types (Application-specific)
// ============================================================================

export type ToolExecutionResult<T = unknown> = {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
}

export type ToolHandler<TInput = unknown, TOutput = unknown> = (
  input: TInput
) => Promise<ToolExecutionResult<TOutput>>

// ============================================================================
// Conversation Types
// ============================================================================

/**
 * Metadata about a summarization that occurred in the conversation
 * Helps track when and why context was summarized
 */
export type SummaryMetadata = {
  readonly summarizedAt: string
  readonly originalMessageCount: number
  readonly messagesKept: number
  readonly tokenCountBefore: number
  readonly tokenCountAfter: number
}

/**
 * A conversation contains the full message history and metadata
 * Messages use MessageParam from the Anthropic SDK
 */
export type Conversation = {
  readonly id: string
  readonly startedAt: string
  readonly lastMessageAt: string
  readonly messages: readonly MessageParam[]
  readonly tokenCount?: number
  readonly summaries?: readonly SummaryMetadata[]
}

export type ConversationMetadata = {
  readonly id: string
  readonly startedAt: string
  readonly lastMessageAt: string
  readonly messageCount: number
  readonly tokenCount?: number
  readonly summaryCount?: number
}

// ============================================================================
// Execution Tracing Types (Phase 6)
// ============================================================================

/**
 * Tracks a single tool execution during agent processing
 */
export type ToolExecutionTrace = {
  readonly toolName: string
  readonly startTime: string         // ISO 8601 timestamp
  readonly endTime: string           // ISO 8601 timestamp
  readonly durationMs: number
  readonly input: unknown            // Tool input parameters
  readonly output: ToolExecutionResult
  readonly success: boolean
}

/**
 * Tracks a single iteration of the agent loop
 * Each iteration is one API call to Claude
 */
export type AgentIterationTrace = {
  readonly iterationNumber: number   // 1-indexed
  readonly inputTokens: number
  readonly outputTokens: number
  readonly totalTokens: number
  readonly toolsExecuted: readonly ToolExecutionTrace[]
  readonly stopReason: string        // 'end_turn' | 'tool_use' | 'max_tokens'
  readonly timestamp: string         // ISO 8601
}

/**
 * Complete execution trace for a single user message
 * Used for analytics, debugging, and cost tracking
 */
export type AgentExecutionTrace = {
  readonly conversationId: string
  readonly messageId: string         // Unique ID for this exchange
  readonly userMessage: string
  readonly assistantResponse: string
  readonly startTime: string
  readonly endTime: string
  readonly durationMs: number
  readonly totalInputTokens: number  // Sum across all iterations
  readonly totalOutputTokens: number // Sum across all iterations
  readonly totalTokens: number
  readonly totalCostUsd: number      // Estimated cost based on model pricing
  readonly iterations: readonly AgentIterationTrace[]
  readonly model: Model
}

/**
 * Safety limits to prevent runaway costs and infinite loops
 */
export type SafetyLimits = {
  readonly maxIterations: number           // Default: 10
  readonly hardTokenLimit: number          // Default: 200,000
  readonly summarizationThreshold: number  // Default: 150,000
  readonly maxTokensPerRequest: number     // Default: 4,096
}

// ============================================================================
// Agent Types
// ============================================================================

export type AgentConfig = {
  readonly apiKey: string
  readonly model: Model
  readonly maxTokens?: number
  readonly maxConversationTokens?: number  // Token limit for conversation context
  readonly safetyLimits?: SafetyLimits
}

export type AgentContext = {
  conversation: Conversation
  readonly systemPrompt: string
}

export type AgentResponse = {
  readonly response: string
  readonly updatedConversation: Conversation
  readonly usage?: Usage
  readonly trace: AgentExecutionTrace
}

/**
 * Agent interface
 */
export type Agent = {
  processMessage(userMessage: string, conversationId?: string): Promise<Result<AgentResponse>>
}

// ============================================================================
// CLI Command Types
// ============================================================================

export type CommandHandler = (
  args: readonly string[],
  context: AgentContext
) => Promise<Result<AgentContext>>

export type Command = {
  readonly name: string
  readonly aliases?: readonly string[]
  readonly description: string
  readonly handler: CommandHandler
}
