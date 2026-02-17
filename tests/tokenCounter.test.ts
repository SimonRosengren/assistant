/**
 * Test script for token counter
 * Run with: tsx tests/tokenCounter.test.ts
 */

import { countTokens, countMessageTokens, getTotalRequestTokens } from '../src/core/tokenCounter.js'
import type { MessageParam } from '../src/types/index.js'
import { tools } from '../src/tools/definitions.js'

console.log('🧪 Testing Token Counter\n')

// Test 1: Basic token counting
console.log('Test 1: Basic token counting')
const text1 = 'Hello, world!'
const tokens1 = countTokens(text1)
console.log(`  Input: "${text1}"`)
console.log(`  Tokens: ${tokens1}`)
console.log(`  ✅ Expected ~3-4 tokens\n`)

// Test 2: Longer text
console.log('Test 2: Longer text')
const text2 = 'The quick brown fox jumps over the lazy dog. This is a test sentence.'
const tokens2 = countTokens(text2)
console.log(`  Input: "${text2}"`)
console.log(`  Tokens: ${tokens2}`)
console.log(`  ✅ Expected ~15-20 tokens\n`)

// Test 3: Message token counting
console.log('Test 3: Message token counting')
const messages: MessageParam[] = [
  { role: 'user', content: 'Hello!' },
  { role: 'assistant', content: 'Hi there! How can I help you?' },
  { role: 'user', content: 'What is 2+2?' },
]
const messageTokens = countMessageTokens(messages)
console.log(`  Messages: ${messages.length}`)
console.log(`  Total tokens: ${messageTokens}`)
console.log(`  ✅ Expected ~30-40 tokens\n`)

// Test 4: Tool token counting
console.log('Test 4: Complete request tokens')
const systemPrompt = 'You are a helpful assistant.'
const totalTokens = getTotalRequestTokens(systemPrompt, messages, tools)
console.log(`  System prompt: "${systemPrompt}"`)
console.log(`  Messages: ${messages.length}`)
console.log(`  Tools: ${tools.length}`)
console.log(`  Total tokens: ${totalTokens}`)
console.log(`  ✅ Expected ~500-800 tokens (tools add overhead)\n`)

console.log('✅ All tests completed')
console.log('⚠️  Note: Token counts are estimates. Verify manually if accuracy is critical.')
