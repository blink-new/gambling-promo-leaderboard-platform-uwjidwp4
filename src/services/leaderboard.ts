import { supabase } from '../lib/supabase'

export interface LeaderboardUser {
  id: string
  username: string
  avatar_url: string | null
  games_played: number
  win_streak: number
  wagered_amount: number
  total_won: number
  total_lost: number
  last_played_at: string | null
  rank: number
  // Live stats
  is_currently_playing: boolean
  current_session_wagered: number
  last_activity_at: string | null
  affiliate_code_used: string | null
}

export interface GamblingSite {
  id: string
  name: string
  code: string
  logo_url: string | null
  is_active: boolean
}

export interface UserStatistics {
  id: string
  user_id: string
  site_id: string
  games_played: number
  win_streak: number
  wagered_amount: number
  total_won: number
  total_lost: number
  last_played_at: string | null
  affiliate_code_used: string | null
  is_currently_playing: boolean
  current_session_wagered: number
  last_activity_at: string | null
}

interface UserStatWithRelations {
  id: string
  user_id: string
  site_id: string
  games_played: number
  win_streak: number
  wagered_amount: number
  total_won: number
  total_lost: number
  last_played_at: string | null
  affiliate_code_used: string | null
  is_currently_playing: boolean
  current_session_wagered: number
  last_activity_at: string | null
  users: {
    id: string
    username: string
    avatar_url: string | null
  }
  gambling_sites: {
    name: string
    code: string
  }
}

class LeaderboardService {
  // Get all active gambling sites
  async getSites(): Promise<GamblingSite[]> {
    const { data, error } = await supabase
      .from('gambling_sites')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching sites:', error)
      throw error
    }

    return data || []
  }

  // Get leaderboard for a specific site - ONLY users with affiliate codes
  async getLeaderboard(siteName: string, limit: number = 10): Promise<LeaderboardUser[]> {
    const { data, error } = await supabase
      .from('user_statistics')
      .select(`
        *,
        users!inner (
          id,
          username,
          avatar_url
        ),
        gambling_sites!inner (
          name,
          code
        )
      `)
      .eq('gambling_sites.name', siteName)
      .not('affiliate_code_used', 'is', null) // Only show users with affiliate codes
      .order('wagered_amount', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching leaderboard:', error)
      throw error
    }

    // Transform data to match LeaderboardUser interface
    return (data || []).map((item: UserStatWithRelations, index: number) => ({
      id: item.users.id,
      username: item.users.username,
      avatar_url: item.users.avatar_url,
      games_played: item.games_played,
      win_streak: item.win_streak,
      wagered_amount: item.wagered_amount,
      total_won: item.total_won,
      total_lost: item.total_lost,
      last_played_at: item.last_played_at,
      rank: index + 1,
      is_currently_playing: item.is_currently_playing,
      current_session_wagered: item.current_session_wagered,
      last_activity_at: item.last_activity_at,
      affiliate_code_used: item.affiliate_code_used
    }))
  }

  // Update user statistics (for when users report their gambling activity)
  async updateUserStats(
    userId: string, 
    siteName: string, 
    gamesPlayed: number, 
    winStreak: number, 
    wageredAmount: number, 
    totalWon: number, 
    totalLost: number,
    affiliateCode?: string
  ): Promise<void> {
    // First get the site ID
    const { data: site, error: siteError } = await supabase
      .from('gambling_sites')
      .select('id')
      .eq('name', siteName)
      .single()

    if (siteError || !site) {
      throw new Error(`Site not found: ${siteName}`)
    }

    const { error } = await supabase
      .from('user_statistics')
      .upsert({
        user_id: userId,
        site_id: site.id,
        games_played: gamesPlayed,
        win_streak: winStreak,
        wagered_amount: wageredAmount,
        total_won: totalWon,
        total_lost: totalLost,
        affiliate_code_used: affiliateCode || null,
        last_played_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error updating user stats:', error)
      throw error
    }
  }

  // Update live session stats
  async updateLiveSession(
    userId: string,
    siteId: string,
    sessionWagered: number,
    isPlaying: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from('user_statistics')
      .update({
        current_session_wagered: sessionWagered,
        is_currently_playing: isPlaying,
        last_activity_at: new Date().toISOString(),
        session_start_time: isPlaying ? new Date().toISOString() : null
      })
      .eq('user_id', userId)
      .eq('site_id', siteId)

    if (error) {
      console.error('Error updating live session:', error)
      throw error
    }
  }

  // Subscribe to real-time leaderboard updates
  subscribeToLeaderboardChanges(callback: () => void) {
    const subscription = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_statistics'
        },
        callback
      )
      .subscribe()

    return subscription
  }

  // Get user's personal stats across all sites
  async getUserStats(userId: string): Promise<UserStatistics[]> {
    const { data, error } = await supabase
      .from('user_statistics')
      .select(`
        *,
        gambling_sites (
          name,
          code,
          logo_url
        )
      `)
      .eq('user_id', userId)
      .order('wagered_amount', { ascending: false })

    if (error) {
      console.error('Error fetching user stats:', error)
      throw error
    }

    return data || []
  }
}

export const leaderboardService = new LeaderboardService()