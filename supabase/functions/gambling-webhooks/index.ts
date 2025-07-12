import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const siteName = url.searchParams.get('site')
    
    if (!siteName) {
      return new Response(
        JSON.stringify({ error: 'Missing site parameter' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const body = await req.json()
    
    // Expected webhook data format from gambling sites:
    // {
    //   "event": "user_activity",
    //   "user": {
    //     "username": "player123",
    //     "steam_id": "76561198000000000" (optional)
    //   },
    //   "activity": {
    //     "games_played": 5,
    //     "wagered_amount": 100.50,
    //     "won_amount": 150.25,
    //     "lost_amount": 50.00,
    //     "referral_code": "cin",
    //     "timestamp": "2024-01-01T00:00:00Z"
    //   }
    // }

    const { event, user: userData, activity } = body

    if (event !== 'user_activity') {
      return new Response(
        JSON.stringify({ error: 'Unsupported event type' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!userData?.username || !activity?.referral_code) {
      return new Response(
        JSON.stringify({ error: 'Missing required user data or referral code' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the gambling site
    const { data: site, error: siteError } = await supabase
      .from('gambling_sites')
      .select('*')
      .eq('name', siteName)
      .single()

    if (siteError || !site) {
      return new Response(
        JSON.stringify({ error: `Site not found: ${siteName}` }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the referral code matches
    if (site.code !== activity.referral_code) {
      return new Response(
        JSON.stringify({ error: 'Invalid referral code for this site' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user exists, if not create them
    let user = null
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', userData.username)
      .single()

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create them
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          { 
            username: userData.username,
            steam_id: userData.steam_id || null,
            avatar_url: null,
            display_name: userData.username,
            bio: null,
            created_at: new Date().toISOString()
          }
        ])
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
    } else {
      user = existingUser
    }

    // Update or create user statistics
    const { data: existingStats } = await supabase
      .from('user_statistics')
      .select('*')
      .eq('user_id', user.id)
      .eq('site_id', site.id)
      .single()

    const newWageredAmount = (existingStats?.wagered_amount || 0) + (activity.wagered_amount || 0)
    const newTotalWon = (existingStats?.total_won || 0) + (activity.won_amount || 0)
    const newTotalLost = (existingStats?.total_lost || 0) + (activity.lost_amount || 0)
    const newGamesPlayed = (existingStats?.games_played || 0) + (activity.games_played || 0)

    const updateData = {
      user_id: user.id,
      site_id: site.id,
      games_played: newGamesPlayed,
      win_streak: activity.win_streak || existingStats?.win_streak || 0,
      wagered_amount: newWageredAmount,
      total_won: newTotalWon,
      total_lost: newTotalLost,
      affiliate_code_used: activity.referral_code,
      last_played_at: activity.timestamp || new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      is_currently_playing: activity.is_playing || false,
      updated_at: new Date().toISOString()
    }

    const { data: updatedStats, error: updateError } = await supabase
      .from('user_statistics')
      .upsert(updateData)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user statistics:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update user statistics' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        user: user,
        stats: updatedStats
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in gambling-webhooks function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})