"use client"

import { useState } from 'react'
import Link from 'next/link'
import LogoMark from '@/components/ui/LogoMark'
import Button from '@/components/ui/Button'
import TextInput from '@/components/ui/TextInput'
import { supabase } from '@/lib/supabase'
import AuthStatus from '@/components/auth/AuthStatus'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        return
      }
      window.location.href = '/dashboard'
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <LogoMark className="h-5 w-5 text-gray-800" />
            <span className="leading-tight">
              <span className="block font-semibold text-green-800">Kickis Food -</span>
              <span className="block text-green-800 text-sm -mt-0.5">Recipe Manager</span>
            </span>
          </Link>

          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100/70">
              <LogoMark className="h-6 w-6 text-rose-400" />
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your Kickis Food account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <TextInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <TextInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full h-12">
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link 
                href="/signup" 
                className="font-semibold text-green-800 hover:text-green-700 transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>

          {/* Auth Status */}
          <div className="mt-6">
            <AuthStatus />
          </div>
        </div>
      </main>
    </div>
  )
}

// local LogoMark removed in favor of shared component
