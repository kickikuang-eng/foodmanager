import { NextResponse } from 'next/server'
import { detectPlatform, isValidUrl } from '@/lib/platform'
import { supabaseAdmin } from '@/lib/supabase'
import { startApifyActor } from '@/lib/apify'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('scraping_jobs')
    .select('id,url,platform,status,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs: data })
}

export async function POST(request: Request) {
  try {
    const { url, platform, userId } = await request.json()
    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }
    const detected = detectPlatform(url)
    if (!detected || (platform && platform !== detected)) {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('scraping_jobs')
      .insert({ url, platform: detected, user_id: userId, status: 'pending' })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const jobId = data.id

    const apifyRun = await startApifyActor({ url, platform: detected })
    if (apifyRun?.runId) {
      await supabaseAdmin
        .from('scraping_jobs')
        .update({ status: 'processing', result: { apifyRunId: apifyRun.runId } })
        .eq('id', jobId)
    }

    return NextResponse.json({ jobId })
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
