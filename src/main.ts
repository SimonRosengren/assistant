/**
 * Main CLI Entry Point
 * Interactive REPL for the personal assistant agent
 */

import 'dotenv/config'
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { createAgent, cleanup } from './core/agent.js'
import type { AgentConfig } from './types/index.js'
import {
  getCurrentConversationId,
  setCurrentConversationId,
  createNewConversation,
} from './storage/conversations.js'
import { authenticateGoogleOAuth, logoutGoogleOAuth } from './auth/googleAuth.js'

// ============================================================================
// Configuration
// ============================================================================

const API_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = (process.env.MODEL || 'claude-3-5-haiku-20241022') as any
const MAX_CONVERSATION_TOKENS = parseInt(
  process.env.MAX_CONVERSATION_TOKENS || '100000'
)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

// Check for --verbose flag
const VERBOSE = process.argv.includes('--verbose')

// ============================================================================
// Main CLI
// ============================================================================

async function main() {
  // Validate API key
  if (!API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY not found in environment')
    console.error('   Please create a .env file with your API key')
    console.error('   See .env.example for reference')
    process.exit(1)
  }

  // Validate Google OAuth credentials if environment variables are set
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    console.log('✅ Google OAuth credentials found.')
  } else {
    console.warn('⚠️ Google OAuth credentials not found. Calendar tools will not function.')
    console.warn('   Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.')
  }
  
  // Create agent
  const config: AgentConfig = {
    apiKey: API_KEY,
    model: MODEL,
    maxTokens: 4096,
    maxConversationTokens: MAX_CONVERSATION_TOKENS,
  }
  
  const agent = createAgent(config)
  
  // Get or create conversation
  let conversationId: string
  const currentResult = await getCurrentConversationId()
  
  if (currentResult.success && currentResult.data) {
    conversationId = currentResult.data
    console.log(`📝 Resuming conversation ${conversationId.substring(0, 8)}...\n`)
  } else {
    const newResult = await createNewConversation()
    if (!newResult.success) {
      console.error('❌ Failed to create conversation:', newResult.error.message)
      process.exit(1)
    }
    conversationId = newResult.data.id
    await setCurrentConversationId(conversationId)
    console.log(`✨ Starting new conversation ${conversationId.substring(0, 8)}...\n`)
  }
  
  // Show help
  console.log('💬 Personal Assistant')
  console.log('   Type your message and press Enter')
  console.log('   Type "exit" or "quit" to end the conversation')
  console.log('   Type "new" to start a new conversation')
  console.log('   Type "auth google" to authenticate with Google (for Calendar access)')
  console.log('   Type "logout google" to clear Google authentication tokens')
  if (VERBOSE) {
    console.log('   🔍 Verbose mode: ON')
  }
  console.log()
  
  // Create readline interface
  const rl = readline.createInterface({ input, output })
  
  // REPL loop
  let running = true
  while (running) {
    try {
      const userInput = await rl.question('You: ')
      const trimmed = userInput.trim()
      
      if (!trimmed) {
        continue
      }
      
      // Handle special commands
      if (trimmed === 'exit' || trimmed === 'quit') {
        running = false
        continue
      }
      
      if (trimmed === 'new') {
        const newResult = await createNewConversation()
        if (!newResult.success) {
          console.error('❌ Failed to create conversation:', newResult.error.message)
          continue
        }
        conversationId = newResult.data.id
        await setCurrentConversationId(conversationId)
        console.log(`\n✨ Started new conversation ${conversationId.substring(0, 8)}...\n`)
        continue
      }

      if (trimmed === 'auth google') {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
          console.error('\n❌ Google OAuth credentials not set in .env file.')
          console.error('   Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.')
          console.error()
          continue
        }
        console.log('\nInitiating Google OAuth authentication...')
        const authResult = await authenticateGoogleOAuth()
        if (authResult.success) {
          console.log(`\n✅ ${authResult.data}\n`)
        } else {
          console.error(`\n❌ Authentication failed: ${authResult.error.message}\n`)
        }
        continue
      }

      if (trimmed === 'logout google') {
        console.log('\nClearing Google OAuth tokens...')
        const logoutResult = await logoutGoogleOAuth()
        if (logoutResult.success) {
          console.log(`\n✅ ${logoutResult.data}\n`)
        } else {
          console.error(`\n❌ Logout failed: ${logoutResult.error.message}\n`)
        }
        continue
      }
      
      // Process message
      const result = await agent.processMessage(trimmed, conversationId)
      
      if (!result.success) {
        console.error('\n❌ Error:', result.error.message)
        console.error()
        continue
      }
      
      const { response, trace } = result.data
      
      // Display response
      console.log(`\nAssistant: ${response}\n`)
      
      // Display token usage
      if (VERBOSE) {
        // Verbose mode: Show full trace
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📊 Execution Trace')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`   Duration: ${(trace.durationMs / 1000).toFixed(2)}s`)
        console.log(`   Iterations: ${trace.iterations.length}`)
        console.log()
        
        for (const iteration of trace.iterations) {
          console.log(`   Iteration ${iteration.iterationNumber}:`)
          console.log(`     - Input tokens: ${iteration.inputTokens}`)
          console.log(`     - Output tokens: ${iteration.outputTokens}`)
          console.log(`     - Stop reason: ${iteration.stopReason}`)
          
          if (iteration.toolsExecuted.length > 0) {
            console.log(`     - Tools executed:`)
            for (const tool of iteration.toolsExecuted) {
              const status = tool.success ? '✓' : '✗'
              console.log(
                `       ${status} ${tool.toolName} (${tool.durationMs.toFixed(0)}ms)`
              )
            }
          }
          console.log()
        }
        
        console.log(`   Total tokens: ${trace.totalTokens}`)
        console.log(`     - Input: ${trace.totalInputTokens}`)
        console.log(`     - Output: ${trace.totalOutputTokens}`)
        console.log(`   Cost: $${trace.totalCostUsd.toFixed(6)}`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      } else {
        // Default mode: Show token summary only
        console.log(
          `[Tokens] Input: ${trace.totalInputTokens}, ` +
          `Output: ${trace.totalOutputTokens}, ` +
          `Total: ${trace.totalTokens} | ` +
          `Cost: $${trace.totalCostUsd.toFixed(6)}\n`
        )
      }
    } catch (error) {
      console.error('\n❌ Unexpected error:', error)
      console.error()
    }
  }
  
  // Cleanup
  rl.close()
  cleanup()
  console.log('\n👋 Goodbye!\n')
}

// Run
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
});
