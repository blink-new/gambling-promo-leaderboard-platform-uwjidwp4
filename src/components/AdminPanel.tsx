import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Shield, Plus, RefreshCw, Users, TrendingUp, Eye, Trash2, Edit, Clock, Play } from 'lucide-react'
import AutoSyncPanel from './AutoSyncPanel'
import { EditPlayerDialog } from './EditPlayerDialog'
import { supabase } from '../lib/supabase'

const gamblingSites = [
  { name: 'Datdrop', code: 'cin' },
  { name: 'CSGOGEM', code: '20OFF' },
  { name: 'PackDraw', code: 'itscin' },
  { name: 'CSGO LUCK', code: 'CIN5' },
  { name: 'Rain.gg', code: 'cin' },
  { name: 'Clash.gg', code: 'CIN' }
]

interface LeaderboardEntry {
  id: string
  username: string
  site_name: string
  wagered_amount: number
  games_played: number
  win_streak: number
  total_won: number
  total_lost: number
  affiliate_code_used: string
  created_at: string
}

export function AdminPanel() {
  const [formData, setFormData] = useState({
    username: '',
    site_name: '',
    referral_code: '',
    wagered_amount: '',
    games_played: '',
    win_streak: '',
    total_won: '',
    total_lost: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [siteStats, setSiteStats] = useState<Record<string, number>>({})
  const [editingPlayer, setEditingPlayer] = useState<LeaderboardEntry | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [autoUpdateLoading, setAutoUpdateLoading] = useState(false)

  const handleSiteChange = (siteName: string) => {
    const site = gamblingSites.find(s => s.name === siteName)
    setFormData(prev => ({
      ...prev,
      site_name: siteName,
      referral_code: site?.code || ''
    }))
  }

  const loadLeaderboardEntries = async () => {
    setLoadingEntries(true)
    try {
      const { data, error } = await supabase
        .from('user_statistics')
        .select(`
          id,
          wagered_amount,
          games_played,
          win_streak,
          total_won,
          total_lost,
          affiliate_code_used,
          created_at,
          users!inner (username),
          gambling_sites!inner (name)
        `)
        .order('wagered_amount', { ascending: false })

      if (error) throw error

      const entries = data?.map(item => ({
        id: item.id,
        username: item.users.username,
        site_name: item.gambling_sites.name,
        wagered_amount: parseFloat(item.wagered_amount || '0'),
        games_played: item.games_played || 0,
        win_streak: item.win_streak || 0,
        total_won: parseFloat(item.total_won || '0'),
        total_lost: parseFloat(item.total_lost || '0'),
        affiliate_code_used: item.affiliate_code_used || '',
        created_at: item.created_at
      })) || []

      setLeaderboardEntries(entries)

      // Calculate site stats
      const stats: Record<string, number> = {}
      entries.forEach(entry => {
        stats[entry.site_name] = (stats[entry.site_name] || 0) + 1
      })
      setSiteStats(stats)

    } catch (error) {
      console.error('Error loading leaderboard entries:', error)
    } finally {
      setLoadingEntries(false)
    }
  }

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    try {
      const { error } = await supabase
        .from('user_statistics')
        .delete()
        .eq('id', entryId)

      if (error) throw error

      setMessage('✅ Entry deleted successfully!')
      loadLeaderboardEntries()
    } catch (error) {
      console.error('Error deleting entry:', error)
      setMessage('❌ Error deleting entry')
    }
  }

  const handleEditPlayer = (player: LeaderboardEntry) => {
    setEditingPlayer(player)
    setIsEditDialogOpen(true)
  }

  const runAutoUpdate = async () => {
    setAutoUpdateLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('https://cyedbuosylzgoypmbdge.supabase.co/functions/v1/auto-update-wagered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      
      if (response.ok) {
        setMessage(`✅ ${result.message}`)
        loadLeaderboardEntries()
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Auto-update error:', error)
      setMessage('❌ Network error occurred')
    } finally {
      setAutoUpdateLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboardEntries()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('https://cyedbuosylzgoypmbdge.supabase.co/functions/v1/track-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_name: formData.site_name,
          username: formData.username,
          referral_code: formData.referral_code,
          wagered_amount: parseFloat(formData.wagered_amount) || 0,
          games_played: parseInt(formData.games_played) || 0,
          win_streak: parseInt(formData.win_streak) || 0,
          total_won: parseFloat(formData.total_won) || 0,
          total_lost: parseFloat(formData.total_lost) || 0
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setMessage('✅ Player added to leaderboard successfully!')
        setFormData({
          username: '',
          site_name: '',
          referral_code: '',
          wagered_amount: '',
          games_played: '',
          win_streak: '',
          total_won: '',
          total_lost: ''
        })
        // Refresh the entries
        loadLeaderboardEntries()
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch {
      setMessage('❌ Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold gold-gradient glow-text mb-4 flex items-center justify-center gap-3">
          <Shield className="w-8 h-8" />
          Admin Panel
        </h1>
        <p className="text-gray-300 text-lg">
          Manage leaderboard players and automated systems
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-black/60 border-yellow-400/30">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{leaderboardEntries.length}</div>
            <div className="text-sm text-gray-400">Total Players</div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-green-400/30">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {formatAmount(leaderboardEntries.reduce((sum, entry) => sum + entry.wagered_amount, 0))}
            </div>
            <div className="text-sm text-gray-400">Total Wagered</div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-blue-400/30">
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{Object.keys(siteStats).length}</div>
            <div className="text-sm text-gray-400">Active Sites</div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-purple-400/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">Auto</div>
            <div className="text-sm text-gray-400">Updates</div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Update Button */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border-yellow-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-yellow-400 mb-2">Automated Wagered Updates</h3>
                <p className="text-gray-300">
                  Instantly add $1.82-$3.61 to all players' wagered amounts (normally runs every hour)
                </p>
              </div>
              <Button
                onClick={runAutoUpdate}
                disabled={autoUpdateLoading}
                className="bg-yellow-400 text-black hover:bg-yellow-500 glow-hover"
              >
                {autoUpdateLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Run Update Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="add-player">➕ Add Player</TabsTrigger>
          <TabsTrigger value="auto-sync">🚀 Auto-Sync</TabsTrigger>
          <TabsTrigger value="manage">⚙️ Manage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card className="card-glow bg-black/60 border-yellow-400/30">
            <CardHeader>
              <CardTitle className="text-yellow-400 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Current Leaderboard Players</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                All players currently tracked in the leaderboard system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEntries ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-yellow-400" />
                  <p className="text-gray-400">Loading players...</p>
                </div>
              ) : leaderboardEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No players added yet</p>
                  <p className="text-gray-500 text-sm">Use the "Add Player" tab to add your first player</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboardEntries.map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white">{entry.username}</div>
                          <div className="text-sm text-gray-400">{entry.site_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-400">{formatAmount(entry.wagered_amount)}</div>
                        <div className="text-sm text-gray-400">{entry.games_played} games</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-400">
                          {entry.affiliate_code_used}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                          onClick={() => handleEditPlayer(entry)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                          onClick={() => deleteEntry(entry.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Site Breakdown */}
          <Card className="bg-black/60 border-yellow-400/30">
            <CardHeader>
              <CardTitle className="text-yellow-400">Players by Site</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gamblingSites.map(site => (
                  <div key={site.name} className="p-3 bg-gray-900/50 rounded-lg text-center">
                    <div className="font-bold text-white">{site.name}</div>
                    <div className="text-2xl font-bold text-yellow-400">{siteStats[site.name] || 0}</div>
                    <div className="text-sm text-gray-400">players</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-player" className="space-y-6">
          <Card className="card-glow bg-black/60 border-yellow-400/30 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-yellow-400 flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Add Player to Leaderboard</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Add individual players who are using your referral codes to the leaderboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-yellow-400">Player Username *</Label>
                    <Input
                      id="username"
                      placeholder="Enter player username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="bg-black/40 border-yellow-400/30 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site" className="text-yellow-400">Gambling Site *</Label>
                    <Select value={formData.site_name} onValueChange={handleSiteChange}>
                      <SelectTrigger className="bg-black/40 border-yellow-400/30 text-white">
                        <SelectValue placeholder="Select site" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-yellow-400/30">
                        {gamblingSites.map(site => (
                          <SelectItem key={site.name} value={site.name} className="text-white hover:bg-yellow-400/20">
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="referral_code" className="text-yellow-400">Referral Code</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="referral_code"
                      value={formData.referral_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, referral_code: e.target.value }))}
                      className="bg-black/40 border-yellow-400/30 text-white"
                      required
                      readOnly
                    />
                    <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-400">
                      Auto-filled
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wagered_amount" className="text-yellow-400">Wagered ($) *</Label>
                    <Input
                      id="wagered_amount"
                      type="number"
                      step="0.01"
                      placeholder="100.50"
                      value={formData.wagered_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, wagered_amount: e.target.value }))}
                      className="bg-black/40 border-yellow-400/30 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="games_played" className="text-yellow-400">Games</Label>
                    <Input
                      id="games_played"
                      type="number"
                      placeholder="25"
                      value={formData.games_played}
                      onChange={(e) => setFormData(prev => ({ ...prev, games_played: e.target.value }))}
                      className="bg-black/40 border-yellow-400/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_won" className="text-yellow-400">Won ($)</Label>
                    <Input
                      id="total_won"
                      type="number"
                      step="0.01"
                      placeholder="150.25"
                      value={formData.total_won}
                      onChange={(e) => setFormData(prev => ({ ...prev, total_won: e.target.value }))}
                      className="bg-black/40 border-yellow-400/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="win_streak" className="text-yellow-400">Streak</Label>
                    <Input
                      id="win_streak"
                      type="number"
                      placeholder="3"
                      value={formData.win_streak}
                      onChange={(e) => setFormData(prev => ({ ...prev, win_streak: e.target.value }))}
                      className="bg-black/40 border-yellow-400/30 text-white"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-yellow-400 text-black hover:bg-yellow-500 glow-hover" 
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add Player to Leaderboard
                </Button>
                
                {message && (
                  <div className={`p-3 rounded-lg text-center ${
                    message.includes('✅') 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {message}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto-sync" className="space-y-6">
          <AutoSyncPanel />
        </TabsContent>
        
        <TabsContent value="manage" className="space-y-6">
          <Card className="bg-black/60 border-yellow-400/30">
            <CardHeader>
              <CardTitle className="text-yellow-400">System Management</CardTitle>
              <CardDescription className="text-gray-300">
                Advanced system controls and data management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={loadLeaderboardEntries}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loadingEntries}
              >
                {loadingEntries ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh Leaderboard Data
              </Button>
              
              <div className="p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                <h3 className="font-bold text-yellow-400 mb-2">💡 System Features</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• <strong>Auto-Update:</strong> Increases all players' wagered amounts by $1.82-$3.61 every hour</li>
                  <li>• <strong>Edit Players:</strong> Click the edit button on any player to modify their details</li>
                  <li>• <strong>Real-time Updates:</strong> All changes are reflected immediately on the public leaderboard</li>
                  <li>• <strong>Data Safety:</strong> All changes are logged and can be tracked</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditPlayerDialog
        player={editingPlayer}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setEditingPlayer(null)
        }}
        onSave={() => {
          loadLeaderboardEntries()
          setMessage('✅ Player updated successfully!')
        }}
      />
    </div>
  )
}