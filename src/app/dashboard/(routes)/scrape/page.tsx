"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { detectPlatform, isValidUrl } from '@/lib/platform'

interface Job {
  id: string
  url: string
  platform: string
  status: string
  created_at: string
}

export default function ScrapePage() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  async function loadJobs(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/scrape?userId=${id}`)
      const data = await res.json()
      if (res.ok) setJobs((data.jobs as Job[]) || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) loadJobs(userId)
  }, [userId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus(null)
    if (!isValidUrl(url)) {
      setError('Enter a valid URL')
      return
    }
    const platform = detectPlatform(url)
    if (!platform) {
      setError('URL must be from YouTube, Instagram, or TikTok')
      return
    }
    if (!userId) {
      setError('You must be signed in')
      return
    }
    setStatus('Creating job...')
    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, platform, userId }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to create job')
      setStatus(null)
      return
    }
    setStatus(`Job created: ${data.jobId}`)
    setUrl('')
    await loadJobs(userId)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">Add recipe by URL</h1>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste a YouTube / Instagram / TikTok URL"
          className="flex-1 border rounded px-3 py-2"
        />
        <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Add</button>
      </form>
      {status && <p className="text-sm text-gray-600 mt-3">{status}</p>}
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <div className="flex items-center justify-between mt-8">
        <h2 className="text-lg font-semibold">Recent jobs</h2>
        <button disabled={!userId || loading} onClick={() => userId && loadJobs(userId)} className="px-3 py-1.5 rounded border hover:bg-gray-50 text-sm">
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="divide-y border rounded mt-2">
        {jobs.length === 0 && <div className="p-3 text-sm text-gray-500">No jobs yet.</div>}
        {jobs.map(j => (
          <div key={j.id} className="p-3 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{j.platform}</div>
              <div className="text-gray-600 truncate max-w-md">{j.url}</div>
            </div>
            <div className="px-2 py-1 rounded bg-gray-100">{j.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
