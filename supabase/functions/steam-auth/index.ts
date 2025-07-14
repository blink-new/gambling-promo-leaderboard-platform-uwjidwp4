import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
}

// Helper function to get appropriate CORS headers based on origin
function getCorsHeaders(origin: string | null) {
  // Allow betcin.cc, localhost, and Blink domains
  const allowedOrigins = [
    'https://betcin.cc',
    'http://betcin.cc', // Also allow http for testing
    'http://localhost:3000',
    'https://localhost:3000'
  ]

  // Check for exact matches first
  if (origin && allowedOrigins.includes(origin)) {
    return {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': 'application/json'
    }
  }

  // Allow Blink domains (preview and live)
  if (origin && (origin.includes('blink.com') || origin.includes('blink.new') || origin.includes('preview-blink.com'))) {
    return {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': 'application/json'
    }
  }

  // Default CORS headers for other origins
  return { ...corsHeaders, 'Content-Type': 'application/json' }
}

interface SteamUser {
  id: string
  steamId: string
  username: string
  avatar: string
  profileUrl: string
  realName?: string
}

interface SteamProfileResponse {
  response: {
    players: Array<{
      steamid: string
      personaname: string
      profileurl: string
      avatar: string
      avatarmedium: string
      avatarfull: string
      realname?: string
    }>
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration:', {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      })
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: getCorsHeaders(origin) }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    console.log('Steam auth request:', {
      method: req.method,
      pathname: url.pathname,
      origin: origin,
      userAgent: req.headers.get('user-agent')
    })

    if (req.method === 'POST') {
      // Handle session verification - check if URL ends with /verify
      if (url.pathname.endsWith('/verify')) {
        console.log('Processing session verification request')

        let requestBody
        try {
          requestBody = await req.json()
        } catch (error) {
          console.error('Failed to parse request body:', error)
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid request body' }),
            { status: 400, headers: getCorsHeaders(origin) }
          )
        }

        const { sessionToken } = requestBody

        if (!sessionToken) {
          console.log('No session token provided')
          return new Response(
            JSON.stringify({ success: false, error: 'No session token provided' }),
            { status: 400, headers: getCorsHeaders(origin) }
          )
        }

        console.log('Verifying session token:', sessionToken.substring(0, 8) + '...')

        // Verify session token in database
        const { data: session, error } = await supabase
          .from('user_sessions')
          .select(`
            *,
            users (
              id,
              steam_id,
              username,
              avatar_url,
              profile_url,
              real_name
            )
          `)
          .eq('session_token', sessionToken)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (error) {
          console.error('Session query error:', error)
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid session' }),
            { status: 401, headers: getCorsHeaders(origin) }
          )
        }

        if (!session || !session.users) {
          console.log('No valid session found')
          return new Response(
            JSON.stringify({ success: false, error: 'Session not found or expired' }),
            { status: 401, headers: getCorsHeaders(origin) }
          )
        }

        console.log('Session verified for user:', session.users.username)

        return new Response(
          JSON.stringify({ success: true, user: { id: session.users.id, steamId: session.users.steam_id, username: session.users.username, avatar: session.users.avatar_url, profileUrl: session.users.profile_url, realName: session.users.real_name } }),
          { headers: getCorsHeaders(origin) }
        )
      }

      // Handle initial authentication
      console.log('Processing Steam authentication request')

      let requestBody
      try {
        requestBody = await req.json()
      } catch (error) {
        console.error('Failed to parse request body:', error)
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid request body' }),
          { status: 400, headers: getCorsHeaders(origin) }
        )
      }

      const { steamId } = requestBody

      if (!steamId) {
        console.log('No Steam ID provided')
        return new Response(
          JSON.stringify({ success: false, error: 'Steam ID is required' }),
          { status: 400, headers: getCorsHeaders(origin) }
        )
      }

      const steamApiKey = Deno.env.get('STEAM_API_KEY')
      if (!steamApiKey) {
        console.error('Steam API key not configured')
        return new Response(
          JSON.stringify({ success: false, error: 'Steam API key not configured' }),
          { status: 500, headers: getCorsHeaders(origin) }
        )
      }

      console.log('Fetching Steam profile for ID:', steamId)

      // Use HTTPS for Steam API
      const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamId}`

      try {
        console.log('Making request to Steam API...')
        const steamResponse = await fetch(steamApiUrl)

        if (!steamResponse.ok) {
          console.error('Steam API request failed:', steamResponse.status, steamResponse.statusText)
          return new Response(
            JSON.stringify({ success: false, error: `Steam API error: ${steamResponse.status}` }),
            { status: 502, headers: getCorsHeaders(origin) }
          )
        }

        const steamData: SteamProfileResponse = await steamResponse.json()
        console.log('Steam API response received')

        if (!steamData.response.players || steamData.response.players.length === 0) {
          console.log('Steam profile not found for ID:', steamId)
          return new Response(
            JSON.stringify({ success: false, error: 'Steam profile not found' }),
            { status: 404, headers: getCorsHeaders(origin) }
          )
        }

        const steamProfile = steamData.response.players[0]
        console.log('Steam profile found:', steamProfile.personaname)

        // Upsert user in database
        const { data: user, error: upsertError } = await supabase
          .from('users')
          .upsert({
            steam_id: steamId,
            username: steamProfile.personaname,
            avatar_url: steamProfile.avatarfull,
            profile_url: steamProfile.profileurl,
            real_name: steamProfile.realname,
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'steam_id'
          })
          .select()
          .single()

        if (upsertError) {
          console.error('Database upsert error:', upsertError)
          return new Response(
            JSON.stringify({ success: false, error: 'Database error' }),
            { status: 500, headers: getCorsHeaders(origin) }
          )
        }

        console.log('User upserted successfully:', user.username)

        // Generate session token
        const sessionToken = crypto.randomUUID()

        // Clear any existing active sessions for this user
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', user.id)

        // Store new session in database
        const { error: sessionError } = await supabase
          .from('user_sessions')
          .insert({
            user_id: user.id,
            session_token: sessionToken,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            is_active: true
          })

        if (sessionError) {
          console.error('Session creation error:', sessionError)
          return new Response(
            JSON.stringify({ success: false, error: 'Session creation failed' }),
            { status: 500, headers: getCorsHeaders(origin) }
          )
        }

        console.log('Session created successfully')

        const userResponse: SteamUser = {
          id: user.id,
          steamId: user.steam_id,
          username: user.username,
          avatar: user.avatar_url,
          profileUrl: user.profile_url,
          realName: user.real_name
        }

        return new Response(
          JSON.stringify({ success: true, user: userResponse, sessionToken }),
          { headers: getCorsHeaders(origin) }
        )

      } catch (steamError) {
        console.error('Steam API error:', steamError)
        return new Response(
          JSON.stringify({ success: false, error: `Steam API request failed: ${steamError.message}` }),
          { status: 500, headers: getCorsHeaders(origin) }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: getCorsHeaders(origin) }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: `Internal server error: ${error.message}` }),
      { status: 500, headers: getCorsHeaders(req.headers.get('origin')) }
    )
  }
})