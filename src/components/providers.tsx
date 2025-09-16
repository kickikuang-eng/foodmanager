'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <PostAuthGuestImporter />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

function PostAuthGuestImporter() {
  useEffect(() => {
    let isMounted = true
    async function run() {
      try {
        const pendingUrl = typeof window !== 'undefined' ? localStorage.getItem('pendingSaveUrl') : null
        if (!pendingUrl) return
        const { data } = await supabase.auth.getUser()
        const userId = data.user?.id
        if (!userId) return

        // Try to persist the recipe/jobs server-side (YouTube path inserts immediately)
        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: pendingUrl, userId }),
        })
        // Best-effort: clear key regardless to avoid loops
        if (typeof window !== 'undefined') localStorage.removeItem('pendingSaveUrl')
        if (!isMounted) return
        if (res.ok) {
          // Redirect user to their scrape dashboard to see the new job/recipe
          if (typeof window !== 'undefined') window.location.href = '/dashboard/scrape'
        }
      } catch {
        if (typeof window !== 'undefined') localStorage.removeItem('pendingSaveUrl')
      }
    }
    run()
    return () => { isMounted = false }
  }, [])
  return null
}
