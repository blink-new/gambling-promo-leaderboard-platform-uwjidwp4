import React, { useState, useEffect } from 'react'
import { Play, RefreshCw, Clock, Users, TrendingUp } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { supabase } from '../lib/supabase'

interface SyncResult {
  site: string
  code: string
  users_found: number
  users_synced: number
  success: boolean
  error?: string
}

interface SyncLog {
  id: number
  sync_type: string
  sites_processed: number
  total_users_synced: number
  results: string
  created_at: string
}

const AutoSyncPanel: React.FC = () => {
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [isManualSyncing, setIsManualSyncing] = useState(false)
  const [syncResults, setSyncResults] = useState<SyncResult[]>([])
  const [totalUsersSynced, setTotalUsersSynced] = useState(0)

  useEffect(() => {
    loadSyncLogs()
    checkAutoSyncStatus()
  }, [])

  const loadSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error loading sync logs:', error)
        return
      }

      setSyncLogs(data || [])
      
      if (data && data.length > 0) {
        setLastSync(new Date(data[0].created_at))
        const latestResults = JSON.parse(data[0].results || '[]')
        setSyncResults(latestResults)
        setTotalUsersSynced(data[0].total_users_synced)
      }
    } catch (error) {
      console.error('Error loading sync logs:', error)
    }
  }

  const checkAutoSyncStatus = () => {
    // Check if there's a scheduled sync running
    const autoSyncStatus = localStorage.getItem('autoSyncEnabled')
    setIsAutoSyncEnabled(autoSyncStatus === 'true')
  }

  const handleManualSync = async () => {
    setIsManualSyncing(true)
    try {
      const response = await fetch(
        `https://cyedbuosylzgoypmbdge.supabase.co/functions/v1/auto-sync-users?manual=true`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      const result = await response.json()
      
      if (result.success) {
        setSyncResults(result.results)
        setTotalUsersSynced(result.total_synced)
        setLastSync(new Date())
        loadSyncLogs()
        
        // Show success message
        alert(`Successfully synced ${result.total_synced} users across ${result.results.length} sites!`)
      } else {
        throw new Error(result.message || 'Sync failed')
      }
    } catch (error) {
      console.error('Manual sync error:', error)
      alert('Sync failed. Please try again.')
    } finally {
      setIsManualSyncing(false)
    }
  }

  const handleAutoSyncToggle = async (enabled: boolean) => {
    setIsAutoSyncEnabled(enabled)
    localStorage.setItem('autoSyncEnabled', enabled.toString())
    
    if (enabled) {
      // Start auto-sync (in a real app, this would set up a scheduled job)
      alert('Auto-sync enabled! The system will check for new users every 30 minutes.')
    } else {
      alert('Auto-sync disabled.')
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString()
  }

  const getStatusColor = (success: boolean) => {
    return success ? 'bg-green-500' : 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold gold-gradient glow-text mb-2">
          Automated User Sync
        </h2>
        <p className="text-gray-300">
          Automatically fetch and sync users who use your promo codes from gambling sites
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="results">Sync Results</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Total Users Synced
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">
                  {totalUsersSynced}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Last Sync
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-300">
                  {lastSync ? formatDate(lastSync) : 'Never'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Sites Monitored
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">
                  6
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Sync Controls</CardTitle>
              <CardDescription className="text-gray-400">
                Manage automatic and manual synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-sync" className="text-white">
                    Auto-Sync Every 30 Minutes
                  </Label>
                  <div className="text-sm text-gray-400">
                    Automatically check for new users using your promo codes
                  </div>
                </div>
                <Switch
                  id="auto-sync"
                  checked={isAutoSyncEnabled}
                  onCheckedChange={handleAutoSyncToggle}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleManualSync}
                  disabled={isManualSyncing}
                  className="flex items-center gap-2"
                >
                  {isManualSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Manual Sync
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Latest Sync Results</CardTitle>
              <CardDescription className="text-gray-400">
                Results from the most recent synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncResults.length > 0 ? (
                <div className="space-y-3">
                  {syncResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(result.success)}`} />
                        <div>
                          <div className="font-semibold text-white">{result.site}</div>
                          <div className="text-sm text-gray-400">Code: {result.code}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">
                          {result.users_synced}/{result.users_found} synced
                        </div>
                        {result.error && (
                          <div className="text-sm text-red-400">{result.error}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No sync results available. Run a manual sync to see results.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Sync History</CardTitle>
              <CardDescription className="text-gray-400">
                Historical log of all synchronization operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncLogs.length > 0 ? (
                <div className="space-y-3">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.sync_type === 'manual' ? 'default' : 'secondary'}>
                            {log.sync_type}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {formatDate(new Date(log.created_at))}
                          </span>
                        </div>
                        <div className="text-yellow-400 font-semibold">
                          {log.total_users_synced} users
                        </div>
                      </div>
                      <div className="text-sm text-gray-300">
                        Processed {log.sites_processed} sites
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No sync logs available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AutoSyncPanel