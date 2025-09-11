import { NextResponse } from 'next/server'
import { detectPlatform, isValidUrl } from '@/lib/platform'

export async function POST(request: Request) {
  try {
    const { url, platform } = await request.json()
    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }
    const detected = detectPlatform(url)
    if (!detected || (platform && platform !== detected)) {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }

    // TODO: Insert a scraping job into Supabase and trigger Apify actor
    // Placeholder: return a fake job id
    const jobId = `job_${Math.random().toString(36).slice(2, 10)}`

    return NextResponse.json({ jobId })
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
