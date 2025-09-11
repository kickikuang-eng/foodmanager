import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRunStatus, getDatasetItems } from '@/lib/apify'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })

  // Fetch job to get Apify run id
  const { data: job, error: jobErr } = await supabaseAdmin
    .from('scraping_jobs')
    .select('id, result, user_id')
    .eq('id', jobId)
    .single()

  if (jobErr || !job) return NextResponse.json({ error: jobErr?.message || 'Job not found' }, { status: 404 })

  const runId = job.result?.apifyRunId
  if (!runId) return NextResponse.json({ error: 'No Apify run id on job' }, { status: 400 })

  const status = await getRunStatus(runId)
  if (!status) return NextResponse.json({ error: 'Failed to fetch run status' }, { status: 500 })

  if (status.status === 'SUCCEEDED' && status.defaultDatasetId) {
    const items = await getDatasetItems(status.defaultDatasetId)
    // Expect the actor to return normalized recipe data; map minimal fields
    const first = Array.isArray(items) ? items[0] : null
    if (first) {
      const recipeInsert = {
        user_id: job.user_id,
        title: first.title || 'Untitled recipe',
        description: first.description || null,
        source_url: first.url || null,
        source_platform: first.platform || 'manual',
        thumbnail_url: first.image || null,
        ingredients: first.ingredients || [],
        instructions: first.instructions || [],
        servings: first.servings || null,
        prep_time: first.prepTime || null,
        cook_time: first.cookTime || null,
        difficulty: 'medium' as const,
        tags: first.tags || [],
      }
      const { error: recErr } = await supabaseAdmin.from('recipes').insert(recipeInsert)
      if (!recErr) {
        await supabaseAdmin
          .from('scraping_jobs')
          .update({ status: 'completed', result: { ...job.result, datasetId: status.defaultDatasetId } })
          .eq('id', jobId)
      }
    }
    return NextResponse.json({ status: 'completed' })
  }

  if (status.status === 'FAILED' || status.status === 'ABORTED' || status.status === 'TIMED-OUT') {
    await supabaseAdmin
      .from('scraping_jobs')
      .update({ status: 'failed' })
      .eq('id', jobId)
    return NextResponse.json({ status: 'failed' })
  }

  return NextResponse.json({ status: 'processing' })
}
