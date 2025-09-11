"use client"

import { useState } from 'react'
import { detectPlatform, isValidUrl } from '@/lib/platform'

export default function ScrapePage() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    setStatus('Creating job...')
    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, platform }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to create job')
      setStatus(null)
      return
    }
    setStatus(`Job created: ${data.jobId}`)
    setUrl('')
  }

  return (
    <div className="max-w-xl">
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
    </div>
  )
}
