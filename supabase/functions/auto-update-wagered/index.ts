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

    console.log('Starting auto-update of wagered amounts...')

    // Get all user statistics with proper error handling
    const { data: userStats, error: fetchError } = await supabase
      .from('user_statistics')
      .select('id, wagered_amount, last_activity_at, updated_at')

    if (fetchError) {
      console.error('Error fetching user stats:', fetchError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch user statistics', 
          details: fetchError.message,
          code: fetchError.code 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!userStats || userStats.length === 0) {
      console.log('No user statistics found')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No user statistics found to update',
          updates: [],
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Found ${userStats.length} users to update`)

    // Update each user's wagered amount with a random amount between $1.82-$3.61
    const updates = []
    const currentTime = new Date().toISOString()

    for (const stat of userStats) {
      const randomIncrease = Math.random() * (3.61 - 1.82) + 1.82
      
      // Safely parse current wagered amount
      const currentWagered = stat.wagered_amount ? parseFloat(stat.wagered_amount.toString()) : 0
      const newWageredAmount = currentWagered + randomIncrease

      // Prepare update data with proper numeric handling
      const updateData = {
        id: stat.id,
        wagered_amount: newWageredAmount, // Keep as number, not string
        last_activity_at: currentTime,
        updated_at: currentTime
      }

      updates.push({
        ...updateData,
        increase: parseFloat(randomIncrease.toFixed(2)),
        oldAmount: currentWagered,
        newAmount: parseFloat(newWageredAmount.toFixed(2))
      })
    }

    console.log(`Preparing to update ${updates.length} user statistics...`)

    // Use individual updates instead of bulk upsert for better error handling
    const updatePromises = updates.map(update => 
      supabase
        .from('user_statistics')
        .update({
          wagered_amount: update.wagered_amount,
          last_activity_at: update.last_activity_at,
          updated_at: update.updated_at
        })
        .eq('id', update.id)
    )

    const updateResults = await Promise.allSettled(updatePromises)
    
    let successCount = 0
    let errorCount = 0
    const errors = []

    updateResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && !result.value.error) {
        successCount++
      } else {
        errorCount++
        const error = result.status === 'rejected' ? result.reason : result.value.error
        console.error(`Error updating user ${updates[index].id}:`, error)
        errors.push({
          userId: updates[index].id,
          error: error?.message || 'Unknown error'
        })
      }
    })

    if (errorCount > 0 && successCount === 0) {
      console.error('All updates failed')
      return new Response(
        JSON.stringify({ 
          error: 'All updates failed', 
          details: errors,
          attempted: updates.length,
          failed: errorCount
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Successfully updated ${successCount}/${updates.length} users`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully updated ${successCount} of ${updates.length} players' wagered amounts`,
        updates: updates.slice(0, Math.min(10, updates.length)).map(u => ({
          id: u.id,
          increase: `$${u.increase.toFixed(2)}`,
          oldTotal: `$${u.oldAmount.toFixed(2)}`,
          newTotal: `$${u.newAmount.toFixed(2)}`
        })),
        stats: {
          total: updates.length,
          successful: successCount,
          failed: errorCount,
          errors: errorCount > 0 ? errors.slice(0, 3) : [] // Limit error details
        },
        timestamp: currentTime
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in auto-update-wagered function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})