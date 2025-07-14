import { useEffect, useState, useCallback } from 'react'
import { leaderboardService, type LeaderboardUser, type GamblingSite } from '../services/leaderboard'

export const useRealTimeLeaderboard = () => {
  const [sites, setSites] = useState<GamblingSite[]>([])
  const [siteLeaderboards, setSiteLeaderboards] = useState<Record<string, LeaderboardUser[]>>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadSites = useCallback(async () => {
    try {
      const sitesData = await leaderboardService.getSites()
      setSites(sitesData)
    } catch (error) {
      console.error('Error loading sites:', error)
    }
  }, [])

  const loadSiteLeaderboard = useCallback(async (siteName: string) => {
    try {
      const data = await leaderboardService.getLeaderboard(siteName, 10)
      setSiteLeaderboards(prev => ({ ...prev, [siteName]: data }))
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading site leaderboard:', error)
    }
  }, [])

  const loadAllSiteLeaderboards = useCallback(async () => {
    for (const site of sites) {
      await loadSiteLeaderboard(site.name)
    }
  }, [sites, loadSiteLeaderboard])

  const refreshData = useCallback(async () => {
    setLoading(true)
    try {
      await loadAllSiteLeaderboards()
    } finally {
      setLoading(false)
    }
  }, [loadAllSiteLeaderboards])

  // Initial data load
  useEffect(() => {
    const initializeData = async () => {
      await loadSites()
    }
    initializeData()
  }, [loadSites])

  // Load leaderboards when sites are available
  useEffect(() => {
    if (sites.length > 0) {
      refreshData()
    }
  }, [sites, refreshData])

  // Set up real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [refreshData])

  // Subscribe to real-time updates from Supabase
  useEffect(() => {
    const subscription = leaderboardService.subscribeToLeaderboardChanges(() => {
      console.log('Leaderboard data changed, refreshing...')
      refreshData()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshData])

  return {
    sites,
    siteLeaderboards,
    loading,
    lastUpdated,
    refreshData,
    loadSiteLeaderboard
  }
}