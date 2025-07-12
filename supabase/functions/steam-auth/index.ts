import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const url = new URL(req.url)
      
      // Handle session verification
      if (url.pathname.endsWith('/verify')) {
        const { sessionToken } = await req.json()
        
        if (!sessionToken) {
          return new Response(
            JSON.stringify({ success: false, error: 'No session token provided' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Verify session token in database
        const { data: session, error } = await supabase
          .from('user_sessions')
          .select('*, users(*)')
          .eq('session_token', sessionToken)
          .eq('is_active', true)
          .single()

        if (error || !session) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid session' }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: {
              id: session.users.id,
              steamId: session.users.steam_id,
              username: session.users.username,
              avatar: session.users.avatar_url,
              profileUrl: session.users.profile_url,
              realName: session.users.real_name
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Handle initial authentication
      const { steamId } = await req.json()
      
      if (!steamId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Steam ID is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const steamApiKey = Deno.env.get('STEAM_API_KEY')
      if (!steamApiKey) {
        return new Response(
          JSON.stringify({ success: false, error: 'Steam API key not configured' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Fetch user data from Steam API
      const steamApiUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamId}`
      
      try {
        const steamResponse = await fetch(steamApiUrl)
        const steamData: SteamProfileResponse = await steamResponse.json()
        
        if (!steamData.response.players || steamData.response.players.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'Steam profile not found' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const steamProfile = steamData.response.players[0]
        
        // Upsert user in database
        const { data: user, error: upsertError } = await supabase
          .from('users')
          .upsert({
            steam_id: steamId,
            username: steamProfile.personaname,
            avatar_url: steamProfile.avatarfull,
            profile_url: steamProfile.profileurl,
            real_name: steamProfile.realname,
            last_login: new Date().toISOString()
          })
          .select()
          .single()

        if (upsertError) {
          console.error('Database upsert error:', upsertError)
          return new Response(
            JSON.stringify({ success: false, error: 'Database error' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Generate session token
        const sessionToken = crypto.randomUUID()
        
        // Store session in database
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
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const userResponse: SteamUser = {
          id: user.id,
          steamId: user.steam_id,
          username: user.username,
          avatar: user.avatar_url,
          profileUrl: user.profile_url,
          realName: user.real_name
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: userResponse,
            sessionToken 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      } catch (steamError) {
        console.error('Steam API error:', steamError)
        return new Response(
          JSON.stringify({ success: false, error: 'Steam API request failed' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})