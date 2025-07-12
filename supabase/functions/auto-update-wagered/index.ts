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

    // Get all user statistics
    const { data: userStats, error: fetchError } = await supabase
      .from('user_statistics')
      .select('*')

    if (fetchError) {
      console.error('Error fetching user stats:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user statistics' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!userStats || userStats.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No user statistics found to update' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update each user's wagered amount with a random amount between $1.82-$3.61
    const updates = userStats.map(stat => {
      const randomIncrease = Math.random() * (3.61 - 1.82) + 1.82
      const newWageredAmount = parseFloat(stat.wagered_amount || '0') + randomIncrease

      return {
        id: stat.id,
        wagered_amount: parseFloat(newWageredAmount.toFixed(2)),
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    // Batch update all user statistics
    const { error: updateError } = await supabase
      .from('user_statistics')
      .upsert(updates)
      .select()

    if (updateError) {
      console.error('Error updating user stats:', updateError)
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
        message: `Successfully updated ${updates.length} players' wagered amounts`,
        updates: updates.map(u => ({
          id: u.id,
          increase: (u.wagered_amount - parseFloat(userStats.find(s => s.id === u.id)?.wagered_amount || '0')).toFixed(2),
          newTotal: u.wagered_amount
        }))
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in auto-update-wagered function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})