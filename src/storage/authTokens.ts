import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureDir } from 'fs-extra'
import { Result } from '../types/index.js'

// Determine the base directory for storage
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const STORAGE_DIR = join(__dirname, '../../data/tokens')
const GOOGLE_TOKEN_FILE = join(STORAGE_DIR, 'google_oauth_tokens.json')

interface GoogleOAuthTokens {
  access_token: string
  refresh_token: string
  scope: string
  token_type: string
  expiry_date: number
}

/**
 * Stores Google OAuth tokens securely.
 * @param tokens - The tokens to store.
 * @returns A Result indicating success or failure.
 */
export async function storeGoogleOAuthTokens(
  tokens: GoogleOAuthTokens
): Promise<Result<void>> {
  try {
    await ensureDir(STORAGE_DIR)
    await fs.writeFile(GOOGLE_TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf8')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to store Google OAuth tokens:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error storing tokens'),
    }
  }
}

/**
 * Retrieves Google OAuth tokens.
 * @returns A Result containing the tokens or an error if not found/readable.
 */
export async function getGoogleOAuthTokens(): Promise<Result<GoogleOAuthTokens>> {
  try {
    const data = await fs.readFile(GOOGLE_TOKEN_FILE, 'utf8')
    const tokens: GoogleOAuthTokens = JSON.parse(data)
    return { success: true, data: tokens }
  } catch (error) {
    // If file doesn't exist, it's not an error, just no tokens yet
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { success: false, error: new Error('Google OAuth tokens not found') }
    }
    console.error('Failed to retrieve Google OAuth tokens:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error('Unknown error retrieving tokens'),
    }
  }
}

/**
 * Clears Google OAuth tokens.
 * @returns A Result indicating success or failure.
 */
export async function clearGoogleOAuthTokens(): Promise<Result<void>> {
  try {
    await fs.unlink(GOOGLE_TOKEN_FILE)
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { success: true, data: undefined } // Already cleared or never existed
    }
    console.error('Failed to clear Google OAuth tokens:', error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error clearing tokens'),
    }
  }
}