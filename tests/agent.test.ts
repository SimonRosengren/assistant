/**
 * Test script for agent
 * Run with: tsx tests/agent.test.ts
 * 
 * NOTE: This requires a valid ANTHROPIC_API_KEY in .env
 */

import 'dotenv/config'
import { createAgent } from '../src/core/agent.js'
import type { AgentConfig } from '../src/types/index.js'

const API_KEY = process.env.ANTHROPIC_API_KEY
if (!API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not found in environment')
  process.exit(1)
}

const config: AgentConfig = {
  apiKey: API_KEY,
  model: 'claude-3-5-haiku-20241022',
  maxTokens: 1024,
}

const agent = createAgent(config)

console.log('🧪 Testing Agent\n')

// Test 1: Simple text response (no tools)
console.log('Test 1: Simple text response')
console.log('  Sending: "Hello, who are you?"')

const result1 = await agent.processMessage('Hello, who are you?')

if (!result1.success) {
  console.error('  ❌ Error:', result1.error.message)
} else {
  console.log(`  ✅ Response: "${result1.data.response.substring(0, 100)}..."`)
  console.log(`  📊 Tokens: ${result1.data.trace.totalTokens} (Input: ${result1.data.trace.totalInputTokens}, Output: ${result1.data.trace.totalOutputTokens})`)
  console.log(`  💰 Cost: $${result1.data.trace.totalCostUsd.toFixed(6)}`)
  console.log(`  🔄 Iterations: ${result1.data.trace.iterations.length}`)
}

console.log()

// Test 2: Tool execution (add task)
console.log('Test 2: Tool execution (add task)')
console.log('  Sending: "Add a task to finish the report by Friday with high priority"')

const result2 = await agent.processMessage(
  'Add a task to finish the report by Friday with high priority',
  result1.success ? result1.data.updatedConversation.id : undefined
)

if (!result2.success) {
  console.error('  ❌ Error:', result2.error.message)
} else {
  console.log(`  ✅ Response: "${result2.data.response}"`)
  console.log(`  📊 Tokens: ${result2.data.trace.totalTokens}`)
  console.log(`  💰 Cost: $${result2.data.trace.totalCostUsd.toFixed(6)}`)
  console.log(`  🔄 Iterations: ${result2.data.trace.iterations.length}`)
  console.log(`  🔧 Tools executed:`)
  for (const iteration of result2.data.trace.iterations) {
    for (const tool of iteration.toolsExecuted) {
      console.log(`      - ${tool.toolName} (${tool.durationMs.toFixed(0)}ms, ${tool.success ? 'success' : 'failed'})`)
    }
  }
}

console.log()

// Test 3: List tasks
console.log('Test 3: List tasks')
console.log('  Sending: "Show me my pending tasks"')

const result3 = await agent.processMessage(
  'Show me my pending tasks',
  result2.success ? result2.data.updatedConversation.id : undefined
)

if (!result3.success) {
  console.error('  ❌ Error:', result3.error.message)
} else {
  console.log(`  ✅ Response: "${result3.data.response}"`)
  console.log(`  📊 Tokens: ${result3.data.trace.totalTokens}`)
  console.log(`  🔄 Iterations: ${result3.data.trace.iterations.length}`)
}

console.log('\n✅ All tests completed')
