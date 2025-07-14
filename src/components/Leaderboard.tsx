import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Trophy, Medal, Crown, TrendingUp, RefreshCw, ArrowUpDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRealTimeLeaderboard } from '../hooks/useRealTimeLeaderboard'
import { CountdownTimer } from './CountdownTimer'
import { supabase } from '../lib/supabase'
import type { LeaderboardUser } from '../services/leaderboard'

const formatAmount = (amount: number) => {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const maskUsername = (username: string) => {
  if (username.length <= 2) return username
  const firstChar = username[0].toUpperCase()
  const lastChar = username[username.length - 1].toUpperCase()
  const asterisks = '*'.repeat(Math.max(1, username.length - 2))
  return `${firstChar}${asterisks}${lastChar}`
}

const formatRelativeTime = (date: Date | string) => {
  const now = new Date()
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - targetDate.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  
  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`
  return `${Math.floor(diffSecs / 86400)}d ago`
}

interface SkinSwapEntry {
  id: string
  username: string
  skin_name: string
  skin_value: number
  swap_type: string
  profit_loss: number
  total_swaps: number
  success_rate: number
  created_at: string
}

export function Leaderboard() {
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [skinSwapData, setSkinSwapData] = useState<SkinSwapEntry[]>([])
  const [skinSwapLoading, setSkinSwapLoading] = useState(false)
  
  const {
    sites,
    siteLeaderboards,
    loading,
    lastUpdated,
    refreshData
  } = useRealTimeLeaderboard()

  // Set initial selected site when sites load
  useEffect(() => {
    if (sites.length > 0 && !selectedSite) {
      setSelectedSite(sites[0].name)
    }
  }, [sites, selectedSite])

  // Load skin swap data
  const loadSkinSwapData = async () => {
    setSkinSwapLoading(true)
    try {
      const { data, error } = await supabase
        .from('skin_swap_leaderboard')
        .select('*')
        .order('profit_loss', { ascending: false })
        .limit(10)

      if (error) throw error
      setSkinSwapData(data || [])
    } catch (error) {
      console.error('Error loading skin swap data:', error)
    } finally {
      setSkinSwapLoading(false)
    }
  }

  useEffect(() => {
    loadSkinSwapData()
  }, [])

  const currentLeaderboard: LeaderboardUser[] = selectedSite ? siteLeaderboards[selectedSite] || [] : []
  const topThree = currentLeaderboard.slice(0, 3)
  const skinSwapTopThree = skinSwapData.slice(0, 3)

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gold-gradient glow-text">
            Live Leaderboard
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            <span className="text-yellow-400 font-bold">Players using our referral code</span> - Live tracking of users who are wagering using our referral codes
          </p>
          
          {/* Prize Structure */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
            <Card className="bg-gradient-to-b from-yellow-400/20 to-yellow-600/10 border-yellow-400/50">
              <CardContent className="p-4 text-center">
                <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2 crown-bounce" />
                <div className="text-2xl font-bold text-yellow-400">$25,000</div>
                <div className="text-sm text-yellow-300">1st Place</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-b from-gray-400/20 to-gray-600/10 border-gray-400/50">
              <CardContent className="p-4 text-center">
                <Medal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-400">$11,000</div>
                <div className="text-sm text-gray-300">2nd Place</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-b from-amber-600/20 to-amber-800/10 border-amber-600/50">
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-600">$5,000</div>
                <div className="text-sm text-amber-500">3rd Place</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="gambling" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md mx-auto">
            <TabsTrigger value="gambling" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Gambling
            </TabsTrigger>
            <TabsTrigger value="skinswap" className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              Skin Swap
            </TabsTrigger>
          </TabsList>

          {/* Gambling Leaderboard */}
          <TabsContent value="gambling">
            <Card className="card-glow bg-black/60 border-yellow-400/30 max-w-6xl mx-auto animate-fade-in">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Gambling Leaderboard</span>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Live tracking of wagered amounts from players using our referral codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Site Selector */}
                <div className="flex justify-center flex-wrap gap-2 mb-8">
                  {sites.map((site) => (
                    <Button
                      key={site.name}
                      variant={selectedSite === site.name ? 'default' : 'outline'}
                      className={`transition-all duration-200 ${
                        selectedSite === site.name
                          ? 'bg-yellow-400 text-black glow-hover'
                          : 'border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10'
                      }`}
                      onClick={() => setSelectedSite(site.name)}
                    >
                      {site.name}
                    </Button>
                  ))}
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading leaderboard...</p>
                  </div>
                ) : currentLeaderboard.length === 0 ? (
                  <div className="text-center text-gray-400 text-lg py-12">
                    <span className="block text-4xl mb-4">🎰</span>
                    <div className="space-y-4">
                      <div className="text-xl font-bold text-yellow-400">No Real Players Yet!</div>
                      <div className="text-gray-300 max-w-lg mx-auto">
                        This leaderboard shows <span className="text-yellow-400 font-bold">only real users</span> who are wagering using our referral codes on gambling sites.
                      </div>
                      <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 max-w-md mx-auto">
                        <div className="text-yellow-400 font-bold mb-2">How to get on the leaderboard:</div>
                        <div className="text-sm text-gray-300 text-left space-y-1">
                          <div>• Use Cin's referral code: <span className="font-mono text-yellow-400">{sites.find(s => s.name === selectedSite)?.code}</span></div>
                          <div>• Play games on {selectedSite}</div>
                          <div>• Your stats will appear here automatically!</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Podium Layout for Top 3 - Gambling */
                  <div className="py-8 px-4">
                    <div className="flex items-end justify-center gap-8 max-w-4xl mx-auto">
                      
                      {/* 2nd Place - Left Side */}
                      {topThree[1] && (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-3xl font-bold border-2 border-gray-400/50 text-white">
                              ?
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center border-2 border-gray-300 text-white font-bold text-sm">
                              2
                            </div>
                          </div>
                          <div className="text-white font-bold text-lg text-center">
                            {maskUsername(topThree[1].username)}
                          </div>
                          <div className="text-gray-400 text-sm font-medium">
                            WAGERED
                          </div>
                          <div className="text-green-400 font-bold text-lg">
                            {formatAmount(topThree[1].wagered_amount)}
                          </div>
                          <div className="bg-gradient-to-r from-gray-500 to-gray-400 text-white font-bold text-lg px-6 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                            <span>$11,000</span>
                            <Trophy className="w-5 h-5 text-yellow-300" />
                          </div>
                        </div>
                      )}
                      
                      {/* 1st Place - Center (Elevated) */}
                      {topThree[0] && (
                        <div className="flex flex-col items-center space-y-4 relative -top-8">
                          <div className="text-yellow-400 mb-2">
                            <Crown className="w-10 h-10 crown-bounce" />
                          </div>
                          <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-4xl font-bold border-3 border-yellow-400 glow-border text-white">
                              ?
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-yellow-300 text-black font-bold text-sm">
                              1
                            </div>
                          </div>
                          <div className="text-yellow-400 font-bold text-xl text-center glow-text">
                            {maskUsername(topThree[0].username)}
                          </div>
                          <div className="text-gray-400 text-sm font-medium">
                            WAGERED
                          </div>
                          <div className="text-green-400 font-bold text-xl">
                            {formatAmount(topThree[0].wagered_amount)}
                          </div>
                          <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold text-xl px-8 py-3 rounded-lg shadow-lg glow-border flex items-center space-x-2">
                            <span>$25,000</span>
                            <Trophy className="w-6 h-6 text-amber-800" />
                          </div>
                        </div>
                      )}
                      
                      {/* 3rd Place - Right Side */}
                      {topThree[2] && (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            <div className="w-18 h-18 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold border-2 border-amber-600/50 text-white">
                              ?
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center border-2 border-amber-400 text-white font-bold text-sm">
                              3
                            </div>
                          </div>
                          <div className="text-white font-bold text-lg text-center">
                            {maskUsername(topThree[2].username)}
                          </div>
                          <div className="text-gray-400 text-sm font-medium">
                            WAGERED
                          </div>
                          <div className="text-green-400 font-bold text-lg">
                            {formatAmount(topThree[2].wagered_amount)}
                          </div>
                          <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-lg px-6 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                            <span>$5,000</span>
                            <Trophy className="w-5 h-5 text-yellow-300" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="text-xs text-gray-400">
                  Last updated {formatRelativeTime(lastUpdated)} • Only showing top 3 players
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                  onClick={refreshData}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Skin Swap Leaderboard */}
          <TabsContent value="skinswap">
            <Card className="card-glow bg-black/60 border-purple-400/30 max-w-6xl mx-auto animate-fade-in">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowUpDown className="w-5 h-5" />
                    <span>Skin Swap Leaderboard</span>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Top skin traders ranked by profit/loss from skin swaps
                </CardDescription>
              </CardHeader>
              <CardContent>
                {skinSwapLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading skin swap leaderboard...</p>
                  </div>
                ) : skinSwapData.length === 0 ? (
                  <div className="text-center text-gray-400 text-lg py-12">
                    <span className="block text-4xl mb-4">🔄</span>
                    <div className="space-y-4">
                      <div className="text-xl font-bold text-purple-400">No Skin Swaps Yet!</div>
                      <div className="text-gray-300 max-w-lg mx-auto">
                        This leaderboard shows players who have made skin swaps and their profit/loss.
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Podium Layout for Top 3 - Skin Swap */
                  <div className="py-8 px-4">
                    <div className="flex items-end justify-center gap-8 max-w-4xl mx-auto">
                      
                      {/* 2nd Place - Left Side */}
                      {skinSwapTopThree[1] && (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-3xl font-bold border-2 border-gray-400/50 text-white">
                              ?
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center border-2 border-gray-300 text-white font-bold text-sm">
                              2
                            </div>
                          </div>
                          <div className="text-white font-bold text-lg text-center">
                            {maskUsername(skinSwapTopThree[1].username)}
                          </div>
                          <div className="text-gray-400 text-sm font-medium">
                            PROFIT/LOSS
                          </div>
                          <div className={`font-bold text-lg ${skinSwapTopThree[1].profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {skinSwapTopThree[1].profit_loss >= 0 ? '+' : ''}${skinSwapTopThree[1].profit_loss.toFixed(2)}
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-400">Latest Skin</div>
                            <div className="text-purple-400 font-medium">{skinSwapTopThree[1].skin_name}</div>
                            <div className="text-yellow-400 text-sm">${skinSwapTopThree[1].skin_value}</div>
                          </div>
                          <div className="bg-gradient-to-r from-gray-500 to-gray-400 text-white font-bold text-lg px-6 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                            <span>$11,000</span>
                            <Trophy className="w-5 h-5 text-yellow-300" />
                          </div>
                        </div>
                      )}
                      
                      {/* 1st Place - Center (Elevated) */}
                      {skinSwapTopThree[0] && (
                        <div className="flex flex-col items-center space-y-4 relative -top-8">
                          <div className="text-purple-400 mb-2">
                            <Crown className="w-10 h-10 crown-bounce" />
                          </div>
                          <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-4xl font-bold border-3 border-purple-400 glow-border text-white">
                              ?
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center border-2 border-purple-300 text-white font-bold text-sm">
                              1
                            </div>
                          </div>
                          <div className="text-purple-400 font-bold text-xl text-center glow-text">
                            {maskUsername(skinSwapTopThree[0].username)}
                          </div>
                          <div className="text-gray-400 text-sm font-medium">
                            PROFIT/LOSS
                          </div>
                          <div className={`font-bold text-xl ${skinSwapTopThree[0].profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {skinSwapTopThree[0].profit_loss >= 0 ? '+' : ''}${skinSwapTopThree[0].profit_loss.toFixed(2)}
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-400">Latest Skin</div>
                            <div className="text-purple-400 font-medium">{skinSwapTopThree[0].skin_name}</div>
                            <div className="text-yellow-400 text-sm">${skinSwapTopThree[0].skin_value}</div>
                          </div>
                          <div className="bg-gradient-to-r from-purple-500 to-purple-400 text-white font-bold text-xl px-8 py-3 rounded-lg shadow-lg glow-border flex items-center space-x-2">
                            <span>$25,000</span>
                            <Trophy className="w-6 h-6 text-amber-300" />
                          </div>
                        </div>
                      )}
                      
                      {/* 3rd Place - Right Side */}
                      {skinSwapTopThree[2] && (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            <div className="w-18 h-18 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold border-2 border-amber-600/50 text-white">
                              ?
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center border-2 border-amber-400 text-white font-bold text-sm">
                              3
                            </div>
                          </div>
                          <div className="text-white font-bold text-lg text-center">
                            {maskUsername(skinSwapTopThree[2].username)}
                          </div>
                          <div className="text-gray-400 text-sm font-medium">
                            PROFIT/LOSS
                          </div>
                          <div className={`font-bold text-lg ${skinSwapTopThree[2].profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {skinSwapTopThree[2].profit_loss >= 0 ? '+' : ''}${skinSwapTopThree[2].profit_loss.toFixed(2)}
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-400">Latest Skin</div>
                            <div className="text-purple-400 font-medium">{skinSwapTopThree[2].skin_name}</div>
                            <div className="text-yellow-400 text-sm">${skinSwapTopThree[2].skin_value}</div>
                          </div>
                          <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-lg px-6 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                            <span>$5,000</span>
                            <Trophy className="w-5 h-5 text-yellow-300" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Additional Stats for Skin Swap */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {skinSwapData.slice(0, 3).map((player, index) => (
                        <Card key={player.id} className="bg-black/40 border-purple-400/30">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-400 text-black' : 
                                  index === 1 ? 'bg-gray-400 text-white' : 
                                  'bg-amber-600 text-white'
                                }`}>
                                  {index + 1}
                                </div>
                                <span className="font-bold text-white">{maskUsername(player.username)}</span>
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                player.swap_type === 'upgrade' ? 'bg-green-500/20 text-green-400' :
                                player.swap_type === 'downgrade' ? 'bg-red-500/20 text-red-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {player.swap_type}
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Total Swaps:</span>
                                <span className="text-white font-medium">{player.total_swaps}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Success Rate:</span>
                                <span className="text-green-400 font-medium">{player.success_rate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Skin Value:</span>
                                <span className="text-yellow-400 font-medium">${player.skin_value}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="text-xs text-gray-400">
                  Showing top performers by profit/loss • Updated in real-time
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-400/30 text-purple-400 hover:bg-purple-400/10"
                  onClick={loadSkinSwapData}
                  disabled={skinSwapLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${skinSwapLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Live Update Indicator */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center space-x-2 text-green-400 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live updates every 30 seconds</span>
          </div>
        </div>

        {/* Countdown Timer - Moved to Bottom */}
        <div className="mt-12">
          <CountdownTimer />
        </div>
      </div>
    </section>
  )
}