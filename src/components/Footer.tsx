import { Trophy, Star, Shield, Users } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-black/80 border-t border-yellow-400/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold gold-gradient glow-text">Bet Cin</span>
            </div>
            <p className="text-gray-400 text-sm">
              The premier platform for gambling promo codes and leaderboards. 
              Track your wins, compete with others, and get exclusive bonuses.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-yellow-400 mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>Exclusive Promo Codes</span>
              </li>
              <li className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>Global Leaderboards</span>
              </li>
              <li className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-yellow-400" />
                <span>Site-Specific Rankings</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span>Secure Tracking</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-yellow-400 mb-4">Gambling Sites</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Golden Casino</li>
              <li>Lucky Poker</li>
              <li>Mega Slots</li>
              <li>Royal Bets</li>
              <li>Diamond Games</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-yellow-400 mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Help Center</li>
              <li>Contact Us</li>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li>Responsible Gambling</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-yellow-400/20 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            &copy; 2024 Bet Cin. All rights reserved. | 
            <span className="text-yellow-400"> Gamble Responsibly </span>| 
            18+ Only
          </p>
        </div>
      </div>
    </footer>
  )
}