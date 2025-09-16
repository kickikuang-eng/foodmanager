import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [timeoutHit, setTimeoutHit] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function check() {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      if (!data.session) {
        router.replace('/login')
      } else {
        setChecking(false)
      }
    }
    check()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login')
    })
    const t = setTimeout(() => setTimeoutHit(true), 3000)
    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
      clearTimeout(t)
    }
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-600">
          Checking your session...
          {timeoutHit && (
            <div className="mt-2">
              If this takes too long, <a href="/login" className="text-blue-600 underline">log in</a> again.
            </div>
          )}
        </div>
      </div>
    )
  }
  return <>{children}</>
}
