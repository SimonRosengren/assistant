/**
 * Slack Client - Socket Mode connection for DM-based assistant interaction
 */

import { SocketModeClient } from '@slack/socket-mode'
import { WebClient } from '@slack/web-api'
import { createAgent, cleanup } from '../core/agent.js'
import { createNewConversation } from '../storage/conversations.js'
import type { AgentConfig } from '../types/index.js'

const API_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = (process.env.MODEL || 'claude-3-5-haiku-20241022') as any
const MAX_CONVERSATION_TOKENS = parseInt(
  process.env.MAX_CONVERSATION_TOKENS || '100000'
)

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN

let socketClient: SocketModeClient | null = null
let webClient: WebClient | null = null
let agent: ReturnType<typeof createAgent> | null = null
let slackConversationId: string | null = null

async function getSlackConversationId(): Promise<string> {
  if (slackConversationId) {
    return slackConversationId
  }

  try {
    const { promises: fs } = await import('node:fs')
    const { join, dirname } = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const slackConvFile = join(__dirname, '../../data/slack-conversation.json')
    
    const content = await fs.readFile(slackConvFile, 'utf-8')
    const data = JSON.parse(content)
    slackConversationId = data.conversationId
    return slackConversationId!
  } catch {
    const result = await createNewConversation()
    if (!result.success) {
      throw new Error('Failed to create Slack conversation: ' + result.error.message)
    }
    
    slackConversationId = result.data.id
    
    const { promises: fs } = await import('node:fs')
    const { join, dirname } = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const dataDir = join(__dirname, '../../data')
    const slackConvFile = join(dataDir, 'slack-conversation.json')
    
    await fs.writeFile(slackConvFile, JSON.stringify({ conversationId: slackConversationId }, null, 2))
    
    return slackConversationId
  }
}

async function handleMessage(event: {
  channel: string
  user?: string
  text?: string
  ts: string
  client: WebClient
}) {
  const SLACK_BOT_USER_ID = process.env.SLACK_BOT_USER_ID

  if (event.user === SLACK_BOT_USER_ID) {
    console.log('[Slack] Message from bot itself, ignoring')
    return
  }

  if (!event.text) {
    console.log('[Slack] Received message without text, ignoring')
    return
  }

  if (!agent) {
    console.error('[Slack] Agent not initialized')
    return
  }

  try {
    console.log(`[Slack] Processing message from user ${event.user}: ${event.text.substring(0, 50)}...`)

    const conversationId = await getSlackConversationId()
    const result = await agent.processMessage(event.text, conversationId)

    if (!result.success) {
      console.error('[Slack] Agent error:', result.error.message)
      await sendResponse(event.client, event.channel, `❌ Error: ${result.error.message}`)
      return
    }

    const { response } = result.data
    await sendResponse(event.client, event.channel, response)
    console.log(`[Slack] Response sent (${response.length} chars)`)
  } catch (error) {
    console.error('[Slack] Error handling message:', error)
    await sendResponse(event.client, event.channel, `❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function sendResponse(client: WebClient, channel: string, text: string) {
  try {
    await client.chat.postMessage({
      channel: channel,
      text: text,
    })
  } catch (error) {
    console.error('[Slack] Error sending response:', error)
  }
}

export async function startSlackClient(): Promise<void> {
  if (!SLACK_BOT_TOKEN || !SLACK_APP_TOKEN) {
    console.warn('[Slack] Bot token or app token not configured, skipping Slack client start')
    return
  }

  if (!API_KEY) {
    console.error('[Slack] ANTHROPIC_API_KEY not set, cannot start Slack client')
    return
  }

  const SLACK_BOT_USER_ID = process.env.SLACK_BOT_USER_ID
  if (!SLACK_BOT_USER_ID) {
    console.error('[Slack] SLACK_BOT_USER_ID not set, cannot start Slack client')
    return
  }

  console.log('[Slack] Starting Socket Mode client...')

  const config: AgentConfig = {
    apiKey: API_KEY,
    model: MODEL,
    maxTokens: 4096,
    maxConversationTokens: MAX_CONVERSATION_TOKENS,
  }

  agent = createAgent(config)

  webClient = new WebClient(SLACK_BOT_TOKEN)

  socketClient = new SocketModeClient({
    appToken: SLACK_APP_TOKEN,
  })

  socketClient.on('message', async (event) => {
    await event.ack()
    if (event.event.channel_type === 'im') {
      await handleMessage({
        channel: event.event.channel,
        user: event.event.user,
        text: event.event.text,
        ts: event.event.ts,
        client: webClient!,
      })
    }
  })

  socketClient.on('hello', () => {
    console.log('[Slack] Connected to Slack via Socket Mode')
  })

  socketClient.on('error', (error) => {
    console.error('[Slack] Socket Mode error:', error)
  })

  socketClient.on('disconnect', (error) => {
    console.log('[Slack] Disconnected from Slack', error ? `(${error})` : '')
  })

  try {
    await socketClient.start()
    console.log('[Slack] Socket Mode client started successfully')
  } catch (error) {
    console.error('[Slack] Failed to start Socket Mode client:', error)
    throw error
  }
}

export async function stopSlackClient(): Promise<void> {
  if (socketClient) {
    console.log('[Slack] Stopping Socket Mode client...')
    await socketClient.disconnect()
    socketClient = null
  }
  
  if (agent) {
    cleanup()
    agent = null
  }
  
  console.log('[Slack] Client stopped')
}
