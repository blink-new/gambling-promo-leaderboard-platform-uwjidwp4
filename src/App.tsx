import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthDialog } from './components/AuthDialog'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { PromoCards } from './components/PromoCards'
import { Leaderboard } from './components/Leaderboard'
import { ProfileModal } from './components/ProfileModal'
import { Footer } from './components/Footer'
import { SteamCallback } from './components/SteamCallback'
import { Button } from './components/ui/button'
import { Trophy, Star, Zap, Shield } from 'lucide-react'
import { DiscordFloatingButton } from './components/DiscordFloatingButton'
import { AdminPanel } from './components/AdminPanel'
import { Toaster } from './components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'

function MainApp() {
  const { user, loading, signOut } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [activeTab, setActiveTab] = useState('home')

  const handleLogin = () => {
    setShowAuthDialog(true)
  }

  const handleLogout = () => {
    signOut()
  }

  useEffect(() => {
    if (activeTab === 'admin' && (!user || user.steamId !== '76561198992444055')) {
      setActiveTab('home')
    }
    if (activeTab === 'debug') {
      setActiveTab('home')
    }
  }, [activeTab, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-yellow-400 glow-text">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header 
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onProfileClick={() => setShowProfileModal(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <main className="relative">
        {activeTab === 'home' && (
          <>
            <Hero setActiveTab={setActiveTab} />
            <div id="promo-cards">
              <PromoCards />
            </div>
            {/* Features Section */}
            <section className="py-20 px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold text-center mb-12 gold-gradient glow-text">
                  Why Choose Our Platform?
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center card-glow p-8 rounded-xl glow-hover">
                    <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2 text-yellow-400">Exclusive Bonuses</h3>
                    <p className="text-gray-300">Get the best promo codes and bonuses from top gambling sites</p>
                  </div>
                  <div className="text-center card-glow p-8 rounded-xl glow-hover">
                    <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2 text-yellow-400">Track Your Success</h3>
                    <p className="text-gray-300">Monitor your wins and climb the leaderboards</p>
                  </div>
                  <div className="text-center card-glow p-8 rounded-xl glow-hover">
                    <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2 text-yellow-400">Instant Updates</h3>
                    <p className="text-gray-300">Real-time leaderboard updates and notifications</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
        
        {activeTab === 'leaderboard' && <Leaderboard />}
        
        {activeTab === 'admin' && (
          <div className="py-20 px-4">
            <div className="max-w-4xl mx-auto">
              {user && user.steamId === '76561198992444055' ? (
                <>
                  <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold gold-gradient glow-text mb-4">Admin Panel</h1>
                    <p className="text-gray-300">Add real users who are using your referral codes to populate the leaderboard</p>
                  </div>
                  <AdminPanel />
                </>
              ) : (
                <div className="text-center">
                  <div className="card-glow p-12 rounded-xl">
                    <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
                    <p className="text-gray-300">You don't have permission to access this admin panel.</p>
                    <p className="text-sm text-gray-400 mt-2">Only authorized administrators can view this page.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'profile' && user && (
          <div className="py-20 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold gold-gradient glow-text mb-4">Your Profile</h1>
                <p className="text-gray-300">Manage your gambling stats and preferences</p>
              </div>
              <Button 
                onClick={() => setShowProfileModal(true)}
                className="bg-yellow-400 text-black hover:bg-yellow-500 glow-hover mx-auto block"
              >
                Edit Profile
              </Button>
            </div>
          </div>
        )}

      </main>
      
      <Footer />
      <DiscordFloatingButton />
      
      {showAuthDialog && (
        <AuthDialog 
          open={showAuthDialog} 
          onClose={() => setShowAuthDialog(false)} 
        />
      )}
      
      {user && showProfileModal && (
        <ProfileModal 
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
        />
      )}
      
      <Toaster />
      <SonnerToaster 
        theme="dark"
        position="top-right"
        closeButton
        toastOptions={{
          style: {
            background: 'rgb(0 0 0 / 0.8)',
            border: '1px solid rgb(234 179 8 / 0.3)',
            color: 'white',
          },
        }}
      />
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/steam-callback" element={<SteamCallback />} />
      <Route path="*" element={<MainApp />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App