/**
 * Conversation Storage Layer
 * Handles reading/writing conversations to data/conversations/{id}.json
 * Tracks current active conversation in data/current.json
 * All functions are pure and return Result types for error handling
 */

import { promises as fs } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Conversation, ConversationMetadata, Result } from '../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = join(__dirname, '../../data')
const CONVERSATIONS_DIR = join(DATA_DIR, 'conversations')
const CURRENT_FILE = join(DATA_DIR, 'current.json')

type CurrentConversationData = {
  conversationId: string | null
}

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Ensures the conversations directory exists
 */
async function ensureConversationsDir(): Promise<Result<void>> {
  try {
    await fs.mkdir(CONVERSATIONS_DIR, { recursive: true })
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to create conversations directory'),
    }
  }
}

/**
 * Generates a unique ID for conversations using UUID v4
 */
function generateConversationId(): string {
  return randomUUID()
}

/**
 * Gets the file path for a conversation
 */
function getConversationPath(id: string): string {
  return join(CONVERSATIONS_DIR, `${id}.json`)
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Loads a conversation by ID
 * Returns error if conversation doesn't exist
 */
export async function loadConversation(id: string): Promise<Result<Conversation>> {
  try {
    const filePath = getConversationPath(id)
    const content = await fs.readFile(filePath, 'utf-8')
    const conversation = JSON.parse(content) as Conversation
    return { success: true, data: conversation }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        success: false,
        error: new Error(`Conversation ${id} not found`),
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to load conversation'),
    }
  }
}

/**
 * Saves a conversation to storage
 * Creates directory if it doesn't exist
 */
export async function saveConversation(conversation: Conversation): Promise<Result<void>> {
  const dirResult = await ensureConversationsDir()
  if (!dirResult.success) {
    return dirResult
  }

  try {
    const filePath = getConversationPath(conversation.id)
    const content = JSON.stringify(conversation, null, 2)
    await fs.writeFile(filePath, content, 'utf-8')
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to save conversation'),
    }
  }
}

/**
 * Creates a new conversation with empty message history
 */
export async function createNewConversation(): Promise<Result<Conversation>> {
  const now = new Date().toISOString()
  const conversation: Conversation = {
    id: generateConversationId(),
    startedAt: now,
    lastMessageAt: now,
    messages: [],
    tokenCount: 0,
    summaries: [],
  }

  const saveResult = await saveConversation(conversation)
  if (!saveResult.success) {
    return saveResult
  }

  return { success: true, data: conversation }
}

/**
 * Gets the current active conversation ID
 * Returns null if no conversation is active
 */
export async function getCurrentConversationId(): Promise<Result<string | null>> {
  try {
    const content = await fs.readFile(CURRENT_FILE, 'utf-8')
    const data = JSON.parse(content) as CurrentConversationData
    return { success: true, data: data.conversationId }
  } catch (error) {
    // If file doesn't exist, no current conversation
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { success: true, data: null }
    }
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to read current conversation'),
    }
  }
}

/**
 * Sets the current active conversation ID
 */
export async function setCurrentConversationId(id: string | null): Promise<Result<void>> {
  const dirResult = await ensureConversationsDir()
  if (!dirResult.success) {
    return dirResult
  }

  try {
    const data: CurrentConversationData = { conversationId: id }
    const content = JSON.stringify(data, null, 2)
    await fs.writeFile(CURRENT_FILE, content, 'utf-8')
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to set current conversation'),
    }
  }
}

/**
 * Lists all conversations with metadata
 * Sorted by last message time (newest first)
 */
export async function listConversations(): Promise<Result<readonly ConversationMetadata[]>> {
  const dirResult = await ensureConversationsDir()
  if (!dirResult.success) {
    return dirResult
  }

  try {
    const files = await fs.readdir(CONVERSATIONS_DIR)
    const conversationFiles = files.filter((f) => f.endsWith('.json'))

    const metadataPromises = conversationFiles.map(async (file) => {
      const id = file.replace('.json', '')
      const result = await loadConversation(id)
      
      if (!result.success) {
        return null
      }

      const conv = result.data
      const metadata: ConversationMetadata = {
        id: conv.id,
        startedAt: conv.startedAt,
        lastMessageAt: conv.lastMessageAt,
        messageCount: conv.messages.length,
        tokenCount: conv.tokenCount,
        summaryCount: conv.summaries?.length ?? 0,
      }
      return metadata
    })

    const allMetadata = await Promise.all(metadataPromises)
    const validMetadata = allMetadata.filter((m): m is ConversationMetadata => m !== null)

    // Sort by lastMessageAt descending (newest first)
    const sorted = validMetadata.sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    )

    return { success: true, data: sorted }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to list conversations'),
    }
  }
}

/**
 * Deletes a conversation by ID
 */
export async function deleteConversation(id: string): Promise<Result<void>> {
  try {
    const filePath = getConversationPath(id)
    await fs.unlink(filePath)
    
    // If this was the current conversation, clear it
    const currentResult = await getCurrentConversationId()
    if (currentResult.success && currentResult.data === id) {
      await setCurrentConversationId(null)
    }

    return { success: true, data: undefined }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        success: false,
        error: new Error(`Conversation ${id} not found`),
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to delete conversation'),
    }
  }
}
