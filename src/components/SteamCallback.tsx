import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export function SteamCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'debug'>('processing')
  const [message, setMessage] = useState('Processing Steam authentication...')
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    try {
      // Parse Steam OpenID response
      const urlParams = new URLSearchParams(window.location.search)
      
      console.log('Steam callback received, URL params:', Object.fromEntries(urlParams))
      console.log('Full URL:', window.location.href)
      
      // Set debug info for troubleshooting
      const debugData = {
        url: window.location.href,
        params: Object.fromEntries(urlParams),
        origin: window.location.origin,
        timestamp: new Date().toISOString(),
        referrer: document.referrer
      }
      setDebugInfo(JSON.stringify(debugData, null, 2))
      
      // Check if this looks like an error response (AWS S3 or other errors)
      const url = window.location.href.toLowerCase()
      if (url.includes('error') || url.includes('accessdenied') || url.includes('access denied')) {
        console.error('Detected error in callback URL')
        setStatus('error')
        setMessage('Steam authentication failed - Access denied. This may be due to an incorrect redirect URL configuration.')
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'STEAM_AUTH_ERROR',
            error: 'Access denied - redirect URL configuration issue. Please contact support.'
          }, window.location.origin)
          
          setTimeout(() => window.close(), 5000)
        }
        return
      }
      
      // Check for Steam OpenID success response
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
      
      // Check for explicit Steam cancellation
      if (urlParams.has('openid.mode') && urlParams.get('openid.mode') === 'cancel') {
        console.log('Steam authentication cancelled by user')
        setStatus('error')
        setMessage('Authentication cancelled by user')
      } else if (urlParams.size === 0) {
        console.log('No OpenID parameters found - possible redirect issue')
        setStatus('debug')
        setMessage('No authentication data received. This might be a redirect configuration issue or Steam access denied.')
      } else {
        console.log('Steam authentication failed - invalid response')
        setStatus('error')
        setMessage('Authentication failed - invalid response from Steam. Please try again.')
      }
      
      // Send error message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'STEAM_AUTH_ERROR',
          error: message || 'Authentication failed'
        }, window.location.origin)
        
        setTimeout(() => window.close(), 3000)
      } else {
        // If no opener, redirect to main page after showing error
        setTimeout(() => {
          window.location.href = '/'
        }, 5000)
      }
      
    } catch (error) {
      console.error('Error processing Steam callback:', error)
      setStatus('error')
      setMessage('An unexpected error occurred during authentication')
      
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
      case 'debug':
        return <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-orange-400" />
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
      case 'debug':
        return 'Debug Information'
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
      case 'debug':
        return 'text-orange-400'
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
          {status === 'debug' && debugInfo && (
            <div className="mt-4 p-3 bg-gray-800 rounded text-left text-xs">
              <p className="text-orange-400 mb-2">Debug Info:</p>
              <pre className="text-gray-300 overflow-auto max-h-40">
                {debugInfo}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}