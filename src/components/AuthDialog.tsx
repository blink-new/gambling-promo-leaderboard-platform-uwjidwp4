import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

interface AuthDialogProps {
  open: boolean
  onClose: () => void
}

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const { signIn, loading } = useAuth()

  const handleSteamLogin = async () => {
    await signIn()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black border-yellow-400/30 text-white text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gold-gradient glow-text mb-2">
            Sign In
          </DialogTitle>
        </DialogHeader>
        <p className="text-gray-300 mb-6">
          Sign in with your Steam account to access leaderboards, customize your profile, and claim rewards.
        </p>
        <Button
          onClick={handleSteamLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#171a21] border border-[#66c0f4] text-[#66c0f4] hover:bg-[#1b2838] hover:text-white text-lg font-semibold py-3 rounded-lg shadow-lg transition-all duration-150 glow-hover disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.19 0 2.34-.21 3.41-.6.3-.11.49-.4.49-.72 0-.43-.35-.78-.78-.78-.18 0-.35.06-.49.16-.86.31-1.79.47-2.75.47-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8c0 .96-.16 1.89-.47 2.75-.1.14-.16.31-.16.49 0 .43.35.78.78.78.32 0 .61-.19.72-.49.39-1.07.6-2.22.6-3.41 0-5.52-4.48-10-10-10z"/>
                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
              </svg>
              Sign in with Steam
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 mt-4">
          We'll only access your public Steam profile information
        </p>
      </DialogContent>
    </Dialog>
  )
}