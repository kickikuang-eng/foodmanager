import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a safe client for the browser that doesn't crash if env vars are missing
function createSafeClient(): SupabaseClient | ReturnType<typeof createSupabaseMock> {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey)
  }
  if (typeof window !== 'undefined') {
    // In the browser, prefer a harmless mock over throwing to keep landing page usable
    console.warn('Supabase env vars missing in client. Using unauthenticated mock. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
    return createSupabaseMock()
  }
  // On the server, still avoid crashing imports; mock will throw on use for server paths
  console.warn('Supabase env vars missing on server import. Using mock that throws on mutation calls.')
  return createSupabaseMock(true)
}

function createSupabaseMock(serverMode = false) {
  // Minimal subset used across the app: auth.getUser, auth.getSession, auth.onAuthStateChange, auth.signOut
  const throwIfServer = (method: string) => {
    if (serverMode) throw new Error(`Supabase not configured. Attempted to call ${method} on server.`)
  }
  return {
    auth: {
      async getUser() {
        return { data: { user: null }, error: null } as any
      },
      async getSession() {
        return { data: { session: null }, error: null } as any
      },
      onAuthStateChange(_cb: any) {
        return { data: { subscription: { unsubscribe() {} } } } as any
      },
      async signOut() {
        throwIfServer('auth.signOut')
        return { error: null } as any
      },
    },
  } as unknown as SupabaseClient
}

export const supabase = createSafeClient()

// For server-side operations that require elevated permissions
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set; server-side admin features may not work.')
}

export const supabaseAdmin: SupabaseClient = (supabaseUrl && serviceRoleKey)
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : (createSupabaseMock(true) as unknown as SupabaseClient)
