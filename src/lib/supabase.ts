import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a Supabase client with authentication completely disabled
// We're using Steam auth instead of Supabase auth
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storage: undefined // Disable auth storage completely
  },
  global: {
    headers: {
      'X-Client-Info': 'gambling-leaderboard-platform'
    }
  }
})

// Disable any auto auth attempts
supabase.auth.onAuthStateChange(() => {
  // Do nothing - we handle auth through Steam
})