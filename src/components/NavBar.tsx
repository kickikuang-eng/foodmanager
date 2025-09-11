"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NavBar() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold text-lg">kök•et</Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {!email ? (
            <>
              <Link href="/login" className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700">Login</Link>
              <Link href="/signup" className="px-3 py-1.5 rounded border hover:bg-gray-50">Sign up</Link>
            </>
          ) : (
            <>
              <span className="hidden sm:inline text-gray-600">{email}</span>
              <button
                className="px-3 py-1.5 rounded border hover:bg-gray-50"
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.href = '/'
                }}
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
