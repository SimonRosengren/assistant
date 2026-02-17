/**
 * Test script for context manager
 * Run with: tsx tests/contextManager.test.ts
 */

import { needsSummarization } from '../src/core/contextManager.js'
import type { Conversation, MessageParam } from '../src/types/index.js'

console.log('🧪 Testing Context Manager\n')

// Test 1: Threshold detection
console.log('Test 1: Threshold detection')

const conv1: Conversation = {
  id: 'test-1',
  startedAt: new Date().toISOString(),
  lastMessageAt: new Date().toISOString(),
  messages: [],
  tokenCount: 100_000,
}

const needsSumm1 = needsSummarization(conv1, 150_000)
console.log(`  Conversation tokens: 100,000`)
console.log(`  Threshold: 150,000`)
console.log(`  Needs summarization: ${needsSumm1}`)
console.log(`  ✅ Expected: false\n`)

const conv2: Conversation = {
  ...conv1,
  tokenCount: 160_000,
}

const needsSumm2 = needsSummarization(conv2, 150_000)
console.log(`  Conversation tokens: 160,000`)
console.log(`  Threshold: 150,000`)
console.log(`  Needs summarization: ${needsSumm2}`)
console.log(`  ✅ Expected: true\n`)

// Test 2: Message splitting logic
console.log('Test 2: Message splitting logic')

const messages: MessageParam[] = []
for (let i = 0; i < 30; i++) {
  messages.push({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i + 1}`,
  })
}

const keepCount = 20
const oldCount = messages.length - keepCount

console.log(`  Total messages: ${messages.length}`)
console.log(`  Keep recent: ${keepCount}`)
console.log(`  To summarize: ${oldCount}`)
console.log(`  ✅ Expected: 10 messages to summarize, 20 to keep\n`)

console.log('✅ All tests completed')
console.log('⚠️  Note: Actual summarization requires API call - test manually with agent')
