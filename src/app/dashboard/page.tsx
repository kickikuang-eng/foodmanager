"use client"

import { useEffect, useState } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import AuthStatus from '@/components/auth/AuthStatus'
import { supabase } from '@/lib/supabase'

interface Recipe {
  id: string
  title: string
  source_url: string | null
  thumbnail_url: string | null
  created_at: string
}

interface Job {
  id: string
  url: string
  platform: string
  status: string
  created_at: string
  result?: any
  error_message?: string
}

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    async function load() {
      if (!userId) return
      setLoading(true)
      setError(null)
      try {
        const [recRes, jobRes] = await Promise.all([
          supabase
            .from('recipes')
            .select('id,title,source_url,thumbnail_url,created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(8),
          supabase
            .from('scraping_jobs')
            .select('id,url,platform,status,created_at,result,error_message')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(8)
        ])
        if (recRes.error) setError(recRes.error.message)
        else setRecipes(recRes.data || [])
        if (jobRes.error) setError(jobRes.error.message)
        else setJobs(jobRes.data || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  return (
    <AuthGuard>
      <main className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <AuthStatus />
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-3">{error}</div>
          )}

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="border rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium">Your recent recipes</h2>
                <a href="/dashboard" className="text-sm text-blue-600 hover:underline">View all</a>
              </div>
              {loading ? (
                <div className="text-sm text-gray-500">Loading…</div>
              ) : recipes.length === 0 ? (
                <div className="text-sm text-gray-500">No recipes yet.</div>
              ) : (
                <ul className="space-y-2">
                  {recipes.map(r => (
                    <li key={r.id} className="flex items-center gap-3">
                      {r.thumbnail_url && (
                        <img src={r.thumbnail_url} alt={r.title} className="w-10 h-10 object-cover rounded" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-medium text-sm">{r.title}</div>
                        {r.source_url && (
                          <a href={r.source_url} target="_blank" rel="noreferrer" className="text-xs text-gray-600 hover:underline truncate inline-block max-w-xs">{r.source_url}</a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium">Recent scraping jobs</h2>
                <a href="/dashboard/scrape" className="text-sm text-blue-600 hover:underline">Add more</a>
              </div>
              {loading ? (
                <div className="text-sm text-gray-500">Loading…</div>
              ) : jobs.length === 0 ? (
                <div className="text-sm text-gray-500">No jobs yet.</div>
              ) : (
                <ul className="divide-y">
                  {jobs.map(j => (
                    <li key={j.id} className="py-2 text-sm flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="capitalize font-medium">{j.platform}</div>
                        <div className="text-gray-600 truncate max-w-xs">{j.url}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        j.status === 'completed' ? 'bg-green-100 text-green-800' :
                        j.status === 'failed' ? 'bg-red-100 text-red-800' :
                        j.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{j.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}
