import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Clock, Gift } from 'lucide-react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      // Calculate the last day of the current month
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
      
      const difference = endOfMonth.getTime() - now.getTime()
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        
        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [])



  return (
    <Card className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-400/50 max-w-2xl mx-auto mb-12 glow-border">
      <CardContent className="p-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Clock className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold text-red-400">Leaderboard Ends in</h2>
            <Gift className="w-6 h-6 text-red-400" />
          </div>
          
          <p className="text-gray-300 mb-6">
            Leaderboard ends and prizes are distributed
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mx-auto">
            <div className="bg-black/40 border border-red-400/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {timeLeft.days.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">Days</div>
            </div>
            
            <div className="bg-black/40 border border-red-400/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {timeLeft.hours.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">Hours</div>
            </div>
            
            <div className="bg-black/40 border border-red-400/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {timeLeft.minutes.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">Minutes</div>
            </div>
            
            <div className="bg-black/40 border border-red-400/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400 mb-1 animate-pulse">
                {timeLeft.seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">Seconds</div>
            </div>
          </div>
          
          <div className="mt-4 text-center">

            <div className="text-sm text-red-400 mt-1 font-medium">
              Make sure to keep playing to maintain your ranking!
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}