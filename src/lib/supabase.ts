import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations that require elevated permissions
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceRoleKey) {
  // Do not throw here in client runtime; only server code uses this. Keep a safe fallback to avoid accidental exposure.
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set; server-side admin features may not work.')
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey || 'missing-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
