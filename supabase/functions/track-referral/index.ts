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

    const { site_name, username, referral_code, wagered_amount, games_played, win_streak, total_won, total_lost } = await req.json()

    // Validate required fields
    if (!site_name || !username || !referral_code) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: site_name, username, referral_code' }),
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
      .eq('name', site_name)
      .single()

    if (siteError || !site) {
      return new Response(
        JSON.stringify({ error: `Site not found: ${site_name}` }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the referral code matches
    if (site.code !== referral_code) {
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
      .eq('username', username)
      .single()

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create them with a fake steam_id for manual entries
      const fakeSteamId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          { 
            username, 
            steam_id: fakeSteamId,
            avatar_url: null,
            profile_url: null,
            real_name: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (createError) {
        console.error('Failed to create user:', createError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user', details: createError.message }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      user = newUser
    } else if (userError) {
      console.error('Error checking user:', userError)
      return new Response(
        JSON.stringify({ error: 'Error checking user', details: userError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
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

    const updateData = {
      user_id: user.id,
      site_id: site.id,
      games_played: games_played || (existingStats?.games_played || 0),
      win_streak: win_streak || (existingStats?.win_streak || 0),
      wagered_amount: wagered_amount || (existingStats?.wagered_amount || 0),
      total_won: total_won || (existingStats?.total_won || 0),
      total_lost: total_lost || (existingStats?.total_lost || 0),
      affiliate_code_used: referral_code,
      last_played_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      is_currently_playing: false,
      updated_at: new Date().toISOString()
    }

    const { data: updatedStats, error: updateError } = await supabase
      .from('user_statistics')
      .upsert(updateData)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update user statistics:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update user statistics', details: updateError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Player added to leaderboard successfully!',
        user: user,
        stats: updatedStats
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in track-referral function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})