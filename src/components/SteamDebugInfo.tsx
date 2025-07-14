import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'


export function SteamDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<{
    currentLocation: {
      origin: string
      hostname: string
      protocol: string
      port: string
      href: string
    }
    redirectLogic: {
      redirectOrigin: string
      finalRedirectUrl: string
      realm: string
      isCustomDomain: boolean
      isBlinkDomain: boolean
      isLocalhost: boolean
    }
    steamUrl: string
    fullSteamUrl: string
  } | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const getDebugInfo = () => {
    const origin = window.location.origin
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    const port = window.location.port
    
    // Simulate the redirect URL logic
    let redirectOrigin = origin
    if (origin.startsWith('http://') && !origin.includes('localhost')) {
      redirectOrigin = origin.replace('http://', 'https://')
    }

    let redirectUrl = ''
    if (origin.includes('betcin.cc')) {
      redirectUrl = `https://betcin.cc/steam-callback`
    } else if (origin.includes('preview-blink.com') || origin.includes('live.blink.new')) {
      redirectUrl = `${redirectOrigin}/steam-callback`
    } else if (origin.includes('localhost')) {
      redirectUrl = `${origin}/steam-callback`
    } else {
      redirectUrl = `${redirectOrigin}/steam-callback`
    }

    // Create Steam URL
    const url = new URL(redirectUrl)
    const realm = `${url.protocol}//${url.hostname}`
    
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': redirectUrl,
      'openid.realm': realm,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    })

    const steamUrl = `https://steamcommunity.com/openid/login?${params.toString()}`

    setDebugInfo({
      currentLocation: {
        origin,
        hostname,
        protocol,
        port,
        href: window.location.href
      },
      redirectLogic: {
        redirectOrigin,
        finalRedirectUrl: redirectUrl,
        realm,
        isCustomDomain: origin.includes('betcin.cc'),
        isBlinkDomain: origin.includes('preview-blink.com') || origin.includes('live.blink.new'),
        isLocalhost: origin.includes('localhost')
      },
      steamUrl: steamUrl.substring(0, 200) + '...',
      fullSteamUrl: steamUrl
    })
    setIsVisible(true)
  }

  const testSteamUrl = () => {
    if (debugInfo?.fullSteamUrl) {
      window.open(debugInfo.fullSteamUrl, '_blank', 'width=800,height=600')
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <Button 
          onClick={getDebugInfo}
          variant="outline"
          size="sm"
          className="bg-yellow-400/10 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20"
        >
          Steam Debug
        </Button>
      ) : (
        <Card className="w-96 max-h-96 overflow-auto bg-black/95 border-yellow-400/30 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-yellow-400 flex justify-between items-center">
              Steam Debug Info
              <Button 
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            {debugInfo && (
              <div className="space-y-3">
                <div>
                  <div className="text-yellow-400 font-semibold mb-1">Current Location:</div>
                  <div className="bg-gray-800 p-2 rounded">
                    <div><strong>Origin:</strong> {debugInfo.currentLocation.origin}</div>
                    <div><strong>Hostname:</strong> {debugInfo.currentLocation.hostname}</div>
                    <div><strong>Protocol:</strong> {debugInfo.currentLocation.protocol}</div>
                    {debugInfo.currentLocation.port && <div><strong>Port:</strong> {debugInfo.currentLocation.port}</div>}
                  </div>
                </div>

                <div>
                  <div className="text-yellow-400 font-semibold mb-1">Redirect Logic:</div>
                  <div className="bg-gray-800 p-2 rounded">
                    <div><strong>Final URL:</strong> {debugInfo.redirectLogic.finalRedirectUrl}</div>
                    <div><strong>Realm:</strong> {debugInfo.redirectLogic.realm}</div>
                    <div><strong>Is Custom Domain:</strong> {debugInfo.redirectLogic.isCustomDomain ? 'Yes' : 'No'}</div>
                    <div><strong>Is Blink Domain:</strong> {debugInfo.redirectLogic.isBlinkDomain ? 'Yes' : 'No'}</div>
                    <div><strong>Is Localhost:</strong> {debugInfo.redirectLogic.isLocalhost ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-yellow-400 font-semibold mb-1">Steam URL:</div>
                  <div className="bg-gray-800 p-2 rounded text-wrap break-all">
                    {debugInfo.steamUrl}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={testSteamUrl}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Test Steam URL
                  </Button>
                  <Button 
                    onClick={() => navigator.clipboard.writeText(debugInfo.fullSteamUrl)}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    Copy Full Steam URL
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}