import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Trophy, Medal, Crown, TrendingUp, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRealTimeLeaderboard } from '../hooks/useRealTimeLeaderboard'
import { CountdownTimer } from './CountdownTimer'
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

export function Leaderboard() {
  const [selectedSite, setSelectedSite] = useState<string>('')
  
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

  const currentLeaderboard: LeaderboardUser[] = selectedSite ? siteLeaderboards[selectedSite] || [] : []
  const topThree = currentLeaderboard.slice(0, 3)

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
                <div className="text-2xl font-bold text-yellow-400">$15,000</div>
                <div className="text-sm text-yellow-300">1st Place</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-b from-gray-400/20 to-gray-600/10 border-gray-400/50">
              <CardContent className="p-4 text-center">
                <Medal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-400">$7,000</div>
                <div className="text-sm text-gray-300">2nd Place</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-b from-amber-600/20 to-amber-800/10 border-amber-600/50">
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-600">$3,000</div>
                <div className="text-sm text-amber-500">3rd Place</div>
              </CardContent>
            </Card>
          </div>
        </div>

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
        
        {/* Leaderboard Display */}
        <Card className="card-glow bg-black/60 border-yellow-400/30 max-w-5xl mx-auto animate-fade-in">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>{selectedSite}</span>
              </div>
              {selectedSite && (
                <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-400">
                  {sites.find(s => s.name === selectedSite)?.code}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-gray-300">
              Top 3 players using Cin's affiliate code with their total wagered amounts
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              /* Podium Layout for Top 3 - Matching Image Design */
              <div className="py-8 px-4">
                <div className="flex items-end justify-center gap-8 max-w-4xl mx-auto">
                  
                  {/* 2nd Place - Left Side */}
                  {topThree[1] && (
                    <div className="flex flex-col items-center space-y-4">
                      {/* Avatar with rank badge */}
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-3xl font-bold border-2 border-gray-400/50 text-white">
                          ?
                        </div>
                        {/* Rank badge */}
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center border-2 border-gray-300 text-white font-bold text-sm">
                          2
                        </div>
                      </div>
                      
                      {/* Username */}
                      <div className="text-white font-bold text-lg text-center">
                        {maskUsername(topThree[1].username)}
                      </div>
                      
                      {/* Wagered label */}
                      <div className="text-gray-400 text-sm font-medium">
                        WAGERED
                      </div>
                      
                      {/* Wagered amount */}
                      <div className="text-green-400 font-bold text-lg">
                        {formatAmount(topThree[1].wagered_amount)}
                      </div>
                      
                      {/* Prize banner */}
                      <div className="bg-gradient-to-r from-gray-500 to-gray-400 text-white font-bold text-lg px-6 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                        <span>$7,000</span>
                        <Trophy className="w-5 h-5 text-yellow-300" />
                      </div>
                    </div>
                  )}
                  
                  {/* 1st Place - Center (Elevated) */}
                  {topThree[0] && (
                    <div className="flex flex-col items-center space-y-4 relative -top-8">
                      {/* Crown above avatar */}
                      <div className="text-yellow-400 mb-2">
                        <Crown className="w-10 h-10 crown-bounce" />
                      </div>
                      
                      {/* Avatar with rank badge */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-4xl font-bold border-3 border-yellow-400 glow-border text-white">
                          ?
                        </div>
                        {/* Rank badge */}
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-yellow-300 text-black font-bold text-sm">
                          1
                        </div>
                      </div>
                      
                      {/* Username */}
                      <div className="text-yellow-400 font-bold text-xl text-center glow-text">
                        {maskUsername(topThree[0].username)}
                      </div>
                      
                      {/* Wagered label */}
                      <div className="text-gray-400 text-sm font-medium">
                        WAGERED
                      </div>
                      
                      {/* Wagered amount */}
                      <div className="text-green-400 font-bold text-xl">
                        {formatAmount(topThree[0].wagered_amount)}
                      </div>
                      
                      {/* Prize banner */}
                      <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold text-xl px-8 py-3 rounded-lg shadow-lg glow-border flex items-center space-x-2">
                        <span>$15,000</span>
                        <Trophy className="w-6 h-6 text-amber-800" />
                      </div>
                    </div>
                  )}
                  
                  {/* 3rd Place - Right Side */}
                  {topThree[2] && (
                    <div className="flex flex-col items-center space-y-4">
                      {/* Avatar with rank badge */}
                      <div className="relative">
                        <div className="w-18 h-18 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold border-2 border-amber-600/50 text-white">
                          ?
                        </div>
                        {/* Rank badge */}
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center border-2 border-amber-400 text-white font-bold text-sm">
                          3
                        </div>
                      </div>
                      
                      {/* Username */}
                      <div className="text-white font-bold text-lg text-center">
                        {maskUsername(topThree[2].username)}
                      </div>
                      
                      {/* Wagered label */}
                      <div className="text-gray-400 text-sm font-medium">
                        WAGERED
                      </div>
                      
                      {/* Wagered amount */}
                      <div className="text-green-400 font-bold text-lg">
                        {formatAmount(topThree[2].wagered_amount)}
                      </div>
                      
                      {/* Prize banner */}
                      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-lg px-6 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                        <span>$3,000</span>
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