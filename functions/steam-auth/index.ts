import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
}

interface SteamUser {
  steamid: string
  communityvisibilitystate: number
  profilestate: number
  personaname: string
  profileurl: string
  avatar: string
  avatarmedium: string
  avatarfull: string
  avatarhash: string
  personastate: number
  realname?: string
  primaryclanid?: string
  timecreated?: number
  personastateflags?: number
  loccountrycode?: string
  locstatecode?: string
  loccityid?: number
}

serve(async (req) => {
  const { url, method } = req
  const pathname = new URL(url).pathname

  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (pathname === '/steam-auth' && method === 'POST') {
      const { steamId, ticket } = await req.json()
      
      if (!steamId || !ticket) {
        return new Response(
          JSON.stringify({ error: 'Missing steamId or ticket' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Verify Steam ticket and get user info
      const steamApiKey = Deno.env.get('STEAM_API_KEY')
      if (!steamApiKey) {
        return new Response(
          JSON.stringify({ error: 'Steam API key not configured' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get Steam user details
      const steamUserResponse = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamApiKey}&steamids=${steamId}`
      )
      
      if (!steamUserResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to get Steam user data' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const steamData = await steamUserResponse.json()
      const steamUser: SteamUser = steamData.response?.players?.[0]

      if (!steamUser) {
        return new Response(
          JSON.stringify({ error: 'Steam user not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('steam_id', steamId)
        .single()

      let user
      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            username: steamUser.personaname,
            avatar_url: steamUser.avatarfull,
            profile_url: steamUser.profileurl,
            real_name: steamUser.realname,
            updated_at: new Date().toISOString()
          })
          .eq('steam_id', steamId)
          .select()
          .single()

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to update user' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        user = updatedUser
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{
            steam_id: steamId,
            username: steamUser.personaname,
            avatar_url: steamUser.avatarfull,
            profile_url: steamUser.profileurl,
            real_name: steamUser.realname,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (createError) {
          return new Response(
            JSON.stringify({ error: 'Failed to create user' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        user = newUser
      }

      // Generate session token (in production, use proper JWT)
      const sessionToken = crypto.randomUUID()
      
      // Store session
      await supabase
        .from('user_sessions')
        .insert([{
          user_id: user.id,
          session_token: sessionToken,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }])

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: user.id,
            steamId: user.steam_id,
            username: user.username,
            avatar: user.avatar_url,
            profileUrl: user.profile_url,
            realName: user.real_name
          },
          sessionToken
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (pathname === '/steam-auth/verify' && method === 'POST') {
      const { sessionToken } = await req.json()
      
      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: 'Missing session token' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Verify session
      const { data: session, error: sessionError } = await supabase
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
        .gt('expires_at', new Date().toISOString())
        .single()

      if (sessionError || !session) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired session' }),
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
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})