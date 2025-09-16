"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AuthAwareLandingProps {
  children: React.ReactNode
}

export default function AuthAwareLanding({ children }: AuthAwareLandingProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth session error:', error)
          setIsAuthenticated(false)
          return
        }

        if (data.session) {
          setIsAuthenticated(true)
          setUserEmail(data.session.user.email)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      }
    }

    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true)
        setUserEmail(session.user.email)
      } else {
        setIsAuthenticated(false)
        setUserEmail(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If authenticated, show authenticated version
  if (isAuthenticated) {
    return <AuthenticatedLanding userEmail={userEmail} />
  }

  // If not authenticated, show normal landing page
  return <>{children}</>
}

function AuthenticatedLanding({ userEmail }: { userEmail: string | null }) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <a href="/dashboard" className="flex items-center gap-3">
            <LogoMark className="h-5 w-5 text-gray-800" />
            <span className="leading-tight">
              <span className="block font-semibold text-green-800">Kickis Food -</span>
              <span className="block text-green-800 text-sm -mt-0.5">Recipe Manager</span>
            </span>
          </a>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-800">
            <a href="/dashboard" className="hover:text-green-700">Dashboard</a>
            <a href="/dashboard/scrape" className="hover:text-green-700">Add Recipes</a>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="text-sm text-gray-600">Welcome, {userEmail}</span>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 transition-colors"
            >
              SIGN OUT
            </button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 pt-24 sm:pt-28 pb-24 text-center">
          <div className="mx-auto mb-10 flex h-10 w-10 items-center justify-center rounded-full bg-rose-100/70">
            <LogoMark className="h-4 w-4 text-rose-400" />
          </div>

          <h1 className="font-extrabold tracking-tight leading-tight text-4xl sm:text-6xl md:text-7xl">
            <span className="block text-green-800">Welcome Back!</span>
            <span className="block text-green-800 mt-2">Ready to add more recipes?</span>
          </h1>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl bg-black text-white px-8 py-4 text-lg font-semibold shadow-md hover:opacity-95 active:scale-[.99] transition-all"
            >
              Go to Dashboard
            </a>
            <a
              href="/dashboard/scrape"
              className="inline-flex items-center justify-center rounded-2xl bg-gray-200 text-gray-800 px-8 py-4 text-lg font-semibold shadow-md hover:bg-gray-300 active:scale-[.99] transition-all"
            >
              Add New Recipe
            </a>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-lg mb-2">Your Recipes</h3>
              <p className="text-gray-600 text-sm">View and manage all your saved recipes in one place.</p>
              <a href="/dashboard" className="inline-block mt-3 text-green-700 font-medium text-sm hover:text-green-800">
                View Recipes →
              </a>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-lg mb-2">Add New Recipe</h3>
              <p className="text-gray-600 text-sm">Paste a video URL to extract a recipe automatically.</p>
              <a href="/dashboard/scrape" className="inline-block mt-3 text-green-700 font-medium text-sm hover:text-green-800">
                Add Recipe →
              </a>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-lg mb-2">Recipe Management</h3>
              <p className="text-gray-600 text-sm">Organize, edit, and categorize your recipe collection.</p>
              <a href="/dashboard" className="inline-block mt-3 text-green-700 font-medium text-sm hover:text-green-800">
                Manage →
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 4l8 14H4L12 4z" />
    </svg>
  );
}
