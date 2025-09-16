import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

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
    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [router])

  if (checking) return null
  return <>{children}</>
}
