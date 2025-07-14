import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { steamAuthService } from '../services/steam-auth'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export function SteamAuthTest() {
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testSteamAuth = async () => {
    setIsLoading(true)
    setTestResult('Starting Steam authentication test...')
    
    try {
      const result = await steamAuthService.authenticateWithSteam()
      
      if (result.success) {
        setTestResult(`✅ SUCCESS: Authenticated as ${result.user?.username} (${result.user?.steamId})`)
      } else {
        setTestResult(`❌ FAILED: ${result.error}`)
      }
    } catch (error) {
      setTestResult(`❌ ERROR: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testBackendConnection = async () => {
    setIsLoading(true)
    setTestResult('Testing backend connection...')
    
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      if (!anonKey) {
        setTestResult('❌ FAILED: Missing VITE_SUPABASE_ANON_KEY')
        return
      }

      const response = await fetch('https://cyedbuosylzgoypmbdge.supabase.co/functions/v1/steam-auth', {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey
        }
      })

      if (response.ok) {
        setTestResult('✅ SUCCESS: Backend connection works, CORS configured properly')
      } else {
        setTestResult(`❌ FAILED: Backend returned ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      setTestResult(`❌ ERROR: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkEnvironment = () => {
    const checks = []
    
    // Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    checks.push(`Current URL: ${window.location.origin}`)
    checks.push(`Protocol: ${window.location.protocol}`)
    checks.push(`Host: ${window.location.host}`)
    checks.push(`Is HTTPS: ${window.location.protocol === 'https:' ? '✅ Yes' : '❌ No'}`)
    checks.push(`Domain Check: ${window.location.hostname.includes('betcin.cc') ? '✅ betcin.cc detected' : window.location.hostname}`)
    checks.push(`Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
    checks.push(`Anon Key: ${anonKey ? '✅ Set' : '❌ Missing'}`)
    checks.push(`User Agent: ${navigator.userAgent}`)
    
    // Test Steam callback URL generation
    const getRedirectUrl = () => {
      const origin = window.location.origin
      if (origin.includes('betcin.cc')) {
        return `https://betcin.cc/steam-callback`
      }
      if (origin.includes('preview-blink.com') || origin.includes('live.blink.new')) {
        return `${origin}/steam-callback`
      }
      if (origin.includes('localhost')) {
        return `${origin}/steam-callback`
      }
      const httpsOrigin = origin.replace('http://', 'https://')
      return `${httpsOrigin}/steam-callback`
    }
    
    const redirectUrl = getRedirectUrl()
    checks.push(`Callback URL: ${redirectUrl}`)
    
    // Test Steam OpenID URL generation
    const url = new URL(redirectUrl)
    const realm = `${url.protocol}//${url.hostname}`
    checks.push(`OpenID Realm: ${realm}`)
    
    setTestResult(checks.join('\\n'))
  }

  return (
    <div className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-black/60 border-yellow-400/30 text-white">
          <CardHeader>
            <CardTitle className="text-center text-yellow-400 glow-text">
              Steam Authentication Debug
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                onClick={checkEnvironment}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Check Environment
              </Button>
              
              <Button
                onClick={testBackendConnection}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                Test Backend
              </Button>
              
              <Button
                onClick={testSteamAuth}
                disabled={isLoading}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Test Steam Auth
              </Button>
            </div>
            
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Testing...</span>
              </div>
            )}
            
            {testResult && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-yellow-400 mb-2 flex items-center">
                  {testResult.includes('✅') ? (
                    <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                  ) : testResult.includes('❌') ? (
                    <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
                  )}
                  Test Results
                </h3>
                <pre className="text-gray-300 whitespace-pre-wrap text-sm">
                  {testResult}
                </pre>
              </div>
            )}
            
            <div className="text-sm text-gray-400 text-center">
              <p>This debug panel helps identify issues with Steam authentication.</p>
              <p>Check the browser console for additional debug information.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}