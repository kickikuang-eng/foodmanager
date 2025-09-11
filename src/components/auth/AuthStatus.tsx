"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!email) return null

  return (
    <div className="flex items-center gap-3 text-sm text-gray-600">
      <span>Signed in as {email}</span>
      <button
        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
        onClick={async () => {
          await supabase.auth.signOut()
          window.location.href = '/login'
        }}
      >
        Sign out
      </button>
    </div>
  )
}
