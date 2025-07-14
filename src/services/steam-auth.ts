// Steam authentication service
export interface SteamUser {
  id: string
  steamId: string
  username: string
  avatar: string
  profileUrl: string
  realName?: string
}

export interface SteamAuthResponse {
  success: boolean
  user?: SteamUser
  sessionToken?: string
  error?: string
}

class SteamAuthService {
  private baseUrl = 'https://cyedbuosylzgoypmbdge.supabase.co/functions/v1'
  private sessionToken: string | null = null
  private user: SteamUser | null = null

  constructor() {
    // Load session from localStorage
    this.sessionToken = localStorage.getItem('steam_session_token')
    const userStr = localStorage.getItem('steam_user')
    if (userStr) {
      try {
        this.user = JSON.parse(userStr)
      } catch (e) {
        console.error('Failed to parse stored user:', e)
        localStorage.removeItem('steam_user')
      }
    }
  }

  private getRedirectUrl(): string {
    // Use the current origin but ensure it's https for production
    const origin = window.location.origin
    console.log('Current origin:', origin)

    // Always use https for the redirect URL in production
    let redirectOrigin = origin
    if (origin.startsWith('http://') && !origin.includes('localhost')) {
      redirectOrigin = origin.replace('http://', 'https://')
    }

    // For your custom domain
    if (origin.includes('betcin.cc')) {
      return `https://betcin.cc/steam-callback`
    }

    // For Blink hosted domains - ensure https
    if (origin.includes('preview-blink.com') || origin.includes('live.blink.new')) {
      return `${redirectOrigin}/steam-callback`
    }

    // For local development
    if (origin.includes('localhost')) {
      return `${origin}/steam-callback`
    }

    // Default fallback - ensure https
    return `${redirectOrigin}/steam-callback`
  }

  async authenticateWithSteam(): Promise<SteamAuthResponse> {
    try {
      console.log('Starting Steam authentication...')

      const redirectUrl = this.getRedirectUrl()
      console.log('Using redirect URL:', redirectUrl)

      // Open Steam authentication popup
      const popup = window.open(
        this.getSteamAuthUrl(redirectUrl),
        'steamAuth',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        throw new Error('Popup blocked - please allow popups for this site')
      }

      // Wait for Steam authentication to complete
      return new Promise((resolve) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            console.log('Popup was closed by user')
            resolve({ success: false, error: 'Authentication cancelled by user' })
          }
        }, 1000)

        // Listen for messages from popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) {
            console.warn('Received message from unexpected origin:', event.origin)
            return
          }

          console.log('Received message from popup:', event.data)

          if (event.data.type === 'STEAM_AUTH_SUCCESS') {
            clearInterval(checkClosed)
            popup.close()
            window.removeEventListener('message', messageListener)

            console.log('Steam auth success, processing with backend...')
            this.handleAuthSuccess(event.data.steamId, event.data.ticket)
              .then(resolve)
              .catch(error => {
                console.error('Backend auth processing failed:', error)
                resolve({ success: false, error: error.message })
              })
          } else if (event.data.type === 'STEAM_AUTH_ERROR') {
            clearInterval(checkClosed)
            popup.close()
            window.removeEventListener('message', messageListener)

            console.error('Steam auth error from popup:', event.data.error)
            resolve({ success: false, error: event.data.error || 'Steam authentication failed' })
          }
        }

        window.addEventListener('message', messageListener)
      })
    } catch (error) {
      console.error('Steam authentication error:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  private getSteamAuthUrl(redirectUrl: string): string {
    // Get the base domain for the realm parameter
    const url = new URL(redirectUrl)
    const realm = `${url.protocol}//${url.hostname}`

    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': redirectUrl,
      'openid.realm': realm,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    })

    const steamUrl = `https://steamcommunity.com/openid/login?${params.toString()}`
    console.log('Steam auth URL:', steamUrl)
    console.log('Redirect URL:', redirectUrl)
    console.log('Realm:', realm)
    return steamUrl
  }

  private async handleAuthSuccess(steamId: string, ticket: string): Promise<SteamAuthResponse> {
    try {
      console.log('Sending authentication request to backend for Steam ID:', steamId)

      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      if (!anonKey) {
        throw new Error('Missing Supabase configuration')
      }

      const response = await fetch(`${this.baseUrl}/steam-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey
        },
        body: JSON.stringify({ steamId, ticket })
      })

      console.log('Backend response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Backend error response:', errorText)
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`)
      }

      const data: SteamAuthResponse = await response.json()
      console.log('Backend response data:', data)

      if (data.success && data.user && data.sessionToken) {
        this.user = data.user
        this.sessionToken = data.sessionToken

        // Store in localStorage
        localStorage.setItem('steam_session_token', data.sessionToken)
        localStorage.setItem('steam_user', JSON.stringify(data.user))

        console.log('Authentication successful for user:', data.user.username)
      } else {
        console.error('Backend returned unsuccessful response:', data)
      }

      return data
    } catch (error) {
      console.error('Backend authentication request failed:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async verifySession(): Promise<SteamAuthResponse> {
    if (!this.sessionToken) {
      console.log('No session token available')
      return { success: false, error: 'No session token' }
    }

    try {
      console.log('Verifying session token...')

      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      if (!anonKey) {
        throw new Error('Missing Supabase configuration')
      }

      const response = await fetch(`${this.baseUrl}/steam-auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey
        },
        body: JSON.stringify({ sessionToken: this.sessionToken })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Session verification failed:', errorText)
        throw new Error('Session verification failed')
      }

      const data: SteamAuthResponse = await response.json()

      if (data.success && data.user) {
        this.user = data.user
        localStorage.setItem('steam_user', JSON.stringify(data.user))
        console.log('Session verified for user:', data.user.username)
      } else {
        console.log('Session verification failed, logging out')
        this.logout()
      }

      return data
    } catch (error) {
      console.error('Session verification error:', error)
      this.logout()
      return { success: false, error: (error as Error).message }
    }
  }

  logout(): void {
    console.log('Logging out user')
    this.user = null
    this.sessionToken = null
    localStorage.removeItem('steam_session_token')
    localStorage.removeItem('steam_user')
  }

  getUser(): SteamUser | null {
    return this.user
  }

  isAuthenticated(): boolean {
    return this.user !== null && this.sessionToken !== null
  }
}

export const steamAuthService = new SteamAuthService()