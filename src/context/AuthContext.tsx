import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { steamAuthService, SteamUser } from '../services/steam-auth'
import { toast } from 'sonner'

interface AuthContextType {
  user: SteamUser | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SteamUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verify existing Steam session on mount
    const verifySession = async () => {
      try {
        setLoading(true)
        const result = await steamAuthService.verifySession()
        if (result.success && result.user) {
          setUser(result.user)
          console.log('Session verified for:', result.user.username)
        } else {
          console.log('No valid session found')
        }
      } catch (error) {
        console.error('Steam session verification failed:', error)
        // Clear any invalid session data
        steamAuthService.logout()
      } finally {
        setLoading(false)
      }
    }

    verifySession()
  }, [])

  const signIn = async () => {
    try {
      setLoading(true)
      
      // Show loading toast
      const loadingToast = toast.loading('Connecting to Steam...', {
        description: 'Please complete the authentication in the popup window'
      })
      
      const result = await steamAuthService.authenticateWithSteam()
      
      // Dismiss loading toast
      toast.dismiss(loadingToast)
      
      if (result.success && result.user) {
        setUser(result.user)
        toast.success('Welcome back!', {
          description: `Successfully signed in as ${result.user.username}`
        })
        console.log(`Welcome back, ${result.user.username}!`)
      } else {
        const errorMessage = result.error || 'Steam authentication failed'
        console.error('Steam authentication failed:', errorMessage)
        
        // Show specific error messages to help users
        if (errorMessage.includes('Popup blocked')) {
          toast.error('Popup Blocked', {
            description: 'Please allow popups for this site and try again',
            duration: 5000
          })
        } else if (errorMessage.includes('cancelled')) {
          toast.info('Authentication Cancelled', {
            description: 'You cancelled the Steam login process'
          })
        } else if (errorMessage.includes('Steam API')) {
          toast.error('Steam Service Error', {
            description: 'There was an issue connecting to Steam. Please try again later.',
            duration: 5000
          })
        } else if (errorMessage.includes('Missing Supabase')) {
          toast.error('Configuration Error', {
            description: 'There was a configuration issue. Please contact support.',
            duration: 5000
          })
        } else {
          toast.error('Authentication Failed', {
            description: errorMessage,
            duration: 5000
          })
        }
      }
    } catch (error) {
      console.error('Steam sign in failed:', error)
      toast.error('Authentication Error', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    steamAuthService.logout()
    setUser(null)
    toast.success('Signed out successfully')
    console.log('Signed out successfully')
  }

  const isAuthenticated = user !== null

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  )
}