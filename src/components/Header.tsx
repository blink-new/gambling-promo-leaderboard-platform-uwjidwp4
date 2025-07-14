import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { User, LogOut, Trophy, Home, UserCircle, Shield } from 'lucide-react'
import { SteamUser } from '../services/steam-auth'

interface HeaderProps {
  user: SteamUser | null
  onLogin: () => void
  onLogout: () => void
  onProfileClick: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Header({ user, onLogin, onLogout, onProfileClick, activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="bg-black/80 backdrop-blur-md border-b border-yellow-400/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="Bet Cin Logo" className="w-10 h-10" />
              <span className="text-2xl font-bold gold-gradient glow-text">Bet Cin</span>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => setActiveTab('home')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  activeTab === 'home' 
                    ? 'bg-yellow-400/20 text-yellow-400 glow-border' 
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  activeTab === 'leaderboard' 
                    ? 'bg-yellow-400/20 text-yellow-400 glow-border' 
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Leaderboard</span>
              </button>
              
              {user && user.steamId === '76561198992444055' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    activeTab === 'admin' 
                      ? 'bg-yellow-400/20 text-yellow-400 glow-border' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </button>
              )}
              
              {user && (
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    activeTab === 'profile' 
                      ? 'bg-yellow-400/20 text-yellow-400 glow-border' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <UserCircle className="w-4 h-4" />
                  <span>Profile</span>
                </button>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8 border-2 border-yellow-400">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-yellow-400 text-black">
                      {user.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-yellow-400">
                    {user.username}
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onProfileClick}
                  className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                >
                  <User className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={onLogin}
                className="bg-yellow-400 text-black hover:bg-yellow-500 glow-hover text-lg font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-150"
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}