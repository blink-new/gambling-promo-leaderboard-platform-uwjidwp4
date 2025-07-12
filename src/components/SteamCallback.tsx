import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export function SteamCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing Steam authentication...')

  useEffect(() => {
    try {
      // Parse Steam OpenID response
      const urlParams = new URLSearchParams(window.location.search)
      
      console.log('Steam callback received, URL params:', Object.fromEntries(urlParams))
      
      if (urlParams.has('openid.mode') && urlParams.get('openid.mode') === 'id_res') {
        const identity = urlParams.get('openid.identity')
        if (identity) {
          // Extract Steam ID from identity URL
          const steamIdMatch = identity.match(/\/id\/(\d+)$/)
          if (steamIdMatch) {
            const steamId = steamIdMatch[1]
            const ticket = urlParams.get('openid.response_nonce') || 'verified'
            
            console.log('Steam authentication successful, Steam ID:', steamId)
            setStatus('success')
            setMessage('Steam authentication successful!')
            
            // Send success message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'STEAM_AUTH_SUCCESS',
                steamId,
                ticket
              }, window.location.origin)
              
              // Close popup after a short delay
              setTimeout(() => window.close(), 1000)
            } else {
              // If no opener, redirect to main page
              setTimeout(() => {
                window.location.href = '/'
              }, 2000)
            }
            return
          }
        }
      }
      
      // Check for error in URL params
      if (urlParams.has('openid.mode') && urlParams.get('openid.mode') === 'cancel') {
        console.log('Steam authentication cancelled by user')
        setStatus('error')
        setMessage('Authentication cancelled')
      } else {
        console.log('Steam authentication failed - invalid response')
        setStatus('error')
        setMessage('Authentication failed - invalid response from Steam')
      }
      
      // Send error message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'STEAM_AUTH_ERROR',
          error: message
        }, window.location.origin)
        
        setTimeout(() => window.close(), 2000)
      } else {
        // If no opener, redirect to main page after showing error
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      }
      
    } catch (error) {
      console.error('Error processing Steam callback:', error)
      setStatus('error')
      setMessage('An unexpected error occurred')
      
      if (window.opener) {
        window.opener.postMessage({
          type: 'STEAM_AUTH_ERROR',
          error: 'Unexpected error occurred'
        }, window.location.origin)
        
        setTimeout(() => window.close(), 2000)
      }
    }
  }, [message])

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-yellow-400" />
      case 'success':
        return <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
      case 'error':
        return <XCircle className="w-6 h-6 mx-auto mb-2 text-red-400" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'processing':
        return 'Processing Steam Authentication'
      case 'success':
        return 'Authentication Successful'
      case 'error':
        return 'Authentication Failed'
    }
  }

  const getTitleColor = () => {
    switch (status) {
      case 'processing':
        return 'text-yellow-400'
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-96 bg-black/60 border-yellow-400/30">
        <CardHeader>
          <CardTitle className={`text-center ${getTitleColor()}`}>
            {getIcon()}
            {getTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-gray-300">
          <p>{message}</p>
          {status === 'error' && (
            <p className="text-sm text-gray-400 mt-2">
              This window will close automatically...
            </p>
          )}
          {status === 'success' && (
            <p className="text-sm text-green-400 mt-2">
              Redirecting you back...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}