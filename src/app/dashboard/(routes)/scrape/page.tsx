"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { detectPlatform, isValidUrl } from '@/lib/scraping'

interface Job {
  id: string
  url: string
  platform: string
  status: string
  created_at: string
  result?: any
  error_message?: string
}

export default function ScrapePage() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  async function parseJsonSafe(res: Response) {
    const text = await res.text()
    if (!text) return {}
    try {
      return JSON.parse(text)
    } catch {
      return { error: text }
    }
  }

  function getErrorMessage(value: unknown): string {
    if (value instanceof Error) return value.message
    if (typeof value === 'string') return value
    try {
      return JSON.stringify(value)
    } catch {
      return Object.prototype.toString.call(value)
    }
  }

  async function loadJobs(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/scrape?userId=${encodeURIComponent(id)}`)
      const data = await parseJsonSafe(res)
      if (res.ok) setJobs((data.jobs as Job[]) || [])
      else setError(typeof data.error === 'string' ? data.error : 'Failed to load jobs')
    } catch (err) {
      setError(`Failed to load jobs: ${getErrorMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) loadJobs(userId)
  }, [userId])

  // Auto-refresh processing jobs
  useEffect(() => {
    if (!autoRefresh || !userId) return
    
    const interval = setInterval(() => {
      const processingJobs = jobs.filter(job => job.status === 'processing')
      if (processingJobs.length > 0) {
        loadJobs(userId)
      } else {
        setAutoRefresh(false)
      }
    }, 5000) // Check every 5 seconds
    
    return () => clearInterval(interval)
  }, [autoRefresh, userId, jobs])

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
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform, userId }),
      })
      const data = await parseJsonSafe(res)
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to create job')
        setStatus(null)
        return
      }
      setStatus(`Job created: ${data.jobId}`)
      setUrl('')
      await loadJobs(userId)
      setAutoRefresh(true) // Start auto-refresh for the new job
    } catch (err) {
      setError(`Failed to create job: ${getErrorMessage(err)}`)
      setStatus(null)
    }
  }

  async function checkStatus(jobId: string) {
    setError(null)
    try {
      const res = await fetch(`/api/scrape/status?jobId=${encodeURIComponent(jobId)}`)
      const data = await parseJsonSafe(res)
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to check status')
        return
      }
      // Show success message if job completed
      if (data.status === 'completed') {
        setStatus(`Recipe successfully scraped and saved! ${data.message || ''}`)
      } else if (data.status === 'failed') {
        setError(data.message || 'Scraping job failed')
      } else {
        setStatus(data.message || 'Job is still processing...')
      }
      if (userId) await loadJobs(userId)
    } catch (err) {
      setError(`Failed to check status: ${getErrorMessage(err)}`)
    }
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
      {error && <p className="text-sm text-red-600 mt-3 whitespace-pre-wrap">{error}</p>}

      <div className="flex items-center justify-between mt-8">
        <h2 className="text-lg font-semibold">Recent jobs</h2>
        <button disabled={!userId || loading} onClick={() => userId && loadJobs(userId)} className="px-3 py-1.5 rounded border hover:bg-gray-50 text-sm">
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="divide-y border rounded mt-2">
        {jobs.length === 0 && <div className="p-3 text-sm text-gray-500">No jobs yet.</div>}
        {jobs.map(j => (
          <div key={j.id} className="p-3 text-sm">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <div className="font-medium capitalize">{j.platform}</div>
                <div className="text-gray-600 truncate max-w-md">{j.url}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(j.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  j.status === 'completed' ? 'bg-green-100 text-green-800' :
                  j.status === 'failed' ? 'bg-red-100 text-red-800' :
                  j.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {j.status}
                </span>
                {j.status === 'processing' && (
                  <button 
                    onClick={() => checkStatus(j.id)} 
                    className="px-2 py-1 rounded border hover:bg-gray-50 text-xs"
                  >
                    Check
                  </button>
                )}
              </div>
            </div>
            {j.error_message && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                Error: {j.error_message}
              </div>
            )}
            {j.status === 'completed' && j.result?.recipeId && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded mt-2">
                ✓ Recipe saved successfully
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
