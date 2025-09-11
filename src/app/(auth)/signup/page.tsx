"use client"

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSuccess('Account created. Please check your email to confirm.')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow rounded p-6">
        <h1 className="text-2xl font-semibold mb-2">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">Sign up with your email and password.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full border rounded px-3 py-2" />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">Already have an account?</span>
          <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </div>
      </div>
    </main>
  )
}
