import { createServer } from 'node:http'
import { parse } from 'node:url'
import { OAuth2Client } from 'google-auth-library'
import { getGoogleOAuthTokens, storeGoogleOAuthTokens, clearGoogleOAuthTokens } from '../storage/authTokens.js'
import { Result } from '../types/index.js'

const PORT = 3005;
const SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly']
const TOKEN_PATH = 'tokens.json' // This will be handled by authTokens.ts now

// OAuth2Client will be initialized once and reused
let oauth2Client: OAuth2Client | null = null

/**
 * Initializes the OAuth2Client with credentials from environment variables.
 * @returns {OAuth2Client} The initialized OAuth2Client instance.
 * @throws {Error} If GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET are not found.
 */
function initializeOAuth2Client(): OAuth2Client {
  if (oauth2Client) {
    return oauth2Client
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      'Google Client ID and Client Secret not found. ' +
      'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.'
    )
  }

  // Use a redirect URI that points to a local server for the CLI flow
  const redirectUri = `http://localhost:${PORT}/oauth2callback`

  oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri)
  return oauth2Client
}

/**
 * Handles the Google OAuth2 authentication flow.
 * Opens a browser window for user consent and captures the authorization code.
 * Stores the resulting tokens securely.
 */
export async function authenticateGoogleOAuth(): Promise<Result<string>> {
  const client = initializeOAuth2Client()
  const authUrl = client.generateAuthUrl({
    access_type: 'offline', // Request a refresh token
    scope: SCOPES,
    prompt: 'consent', // Ensure we always get a refresh token
  })

  console.log('Opening browser for Google authentication...')
  console.log('Please grant access to your Google Calendar events.')
  console.log(`If the browser doesn't open, please visit this URL: ${authUrl}`)

  // Open the URL in the user's default browser
  await openBrowser(authUrl)

  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const requestUrl = req.url
        if (!requestUrl) {
          res.end('Authentication failed: No URL received.')
          server.close()
          return resolve({ success: false, error: new Error('No URL received from OAuth redirect.') })
        }

        const { query } = parse(requestUrl, true)
        const code = query.code as string

        if (!code) {
          res.end('Authentication failed: No authorization code received.')
          server.close()
          return resolve({ success: false, error: new Error('No authorization code received.') })
        }

        const { tokens } = await client.getToken(code)
        client.setCredentials(tokens)

        const storeResult = await storeGoogleOAuthTokens(tokens as any) // Cast to any because of slight type mismatch
        if (!storeResult.success) {
          res.end('Authentication failed: Could not store tokens.')
          server.close()
          return resolve({ success: false, error: storeResult.error })
        }

        res.end('Authentication successful! You can close this tab.')
        server.close()
        resolve({ success: true, data: 'Google OAuth authentication successful.' })
      } catch (error) {
        console.error('Error during OAuth callback:', error)
        res.end('Authentication failed: An error occurred during the callback.')
        server.close()
        resolve({
          success: false,
          error: error instanceof Error ? error : new Error('Unknown error during OAuth callback.'),
        })
      }
    })

    server.listen(PORT, () => {
      console.log(`Waiting for Google authentication callback on http://localhost:${PORT}...`)
    })

    server.on('error', (e: NodeJS.ErrnoException) => {
      if (e.code === 'EADDRINUSE') {
        resolve({
          success: false,
          error: new Error(
            `Port ${PORT} is already in use. Please ensure no other service is using it`
          ),
        })
      } else {
        resolve({
          success: false,
          error: e instanceof Error ? e : new Error('Unknown server error during OAuth flow.'),
        })
      }
    })
  })
}

/**
 * Returns an authenticated Google OAuth2 client.
 * If tokens are expired, it attempts to refresh them.
 * @returns {Promise<Result<OAuth2Client>>} A Promise that resolves with an authenticated OAuth2Client.
 */
export async function getAuthenticatedGoogleClient(): Promise<Result<OAuth2Client>> {
  const client = initializeOAuth2Client()

  const storedTokensResult = await getGoogleOAuthTokens()
  if (!storedTokensResult.success) {
    return { success: false, error: new Error('Google OAuth tokens not found. Please authenticate first.') }
  }

  client.setCredentials(storedTokensResult.data)

  // Check if access token is expired or close to expiring
  if (client.credentials.expiry_date && client.credentials.expiry_date < Date.now() + 60 * 1000) { // Refresh if less than 1 minute left
    console.log('Refreshing Google OAuth access token...')
    try {
      const { credentials } = await client.refreshAccessToken()
      client.setCredentials(credentials)
      await storeGoogleOAuthTokens(credentials as any)
      console.log('Access token refreshed successfully.')
    } catch (error) {
      console.error('Failed to refresh Google OAuth access token:', error)
      await clearGoogleOAuthTokens() // Clear invalid tokens
      return { success: false, error: new Error('Failed to refresh access token. Please re-authenticate.') }
    }
  }

  return { success: true, data: client }
}

/**
 * Clears stored Google OAuth tokens, effectively logging out.
 */
export async function logoutGoogleOAuth(): Promise<Result<string>> {
  const result = await clearGoogleOAuthTokens()
  if (result.success) {
    oauth2Client = null // Clear in-memory client
    return { success: true, data: 'Google OAuth tokens cleared successfully.' }
  }
  return { success: false, error: result.error }
}

/**
 * Helper to open a URL in the default browser.
 * This is a simplified version and might need platform-specific implementations.
 */
async function openBrowser(url: string) {
  const { exec } = await import('node:child_process')
  let command: string

  switch (process.platform) {
    case 'darwin': // macOS
      command = `open "${url}"`
      break
    case 'win32': // Windows
      command = `start "" "${url}"`
      break
    case 'linux': // Linux
      command = `xdg-open "${url}"`
      break
    default:
      console.warn(`Unsupported platform: ${process.platform}. Please open the URL manually: ${url}`)
      return
  }

  exec(command, (error) => {
    if (error) {
      console.error(`Failed to open browser: ${error.message}. Please visit the URL manually: ${url}`)
    }
  })
}

