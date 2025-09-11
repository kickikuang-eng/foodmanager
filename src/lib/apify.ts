export interface StartActorParams {
  url: string
  platform: 'youtube' | 'instagram' | 'tiktok'
}

export interface StartActorResult {
  runId: string
}

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN
const APIFY_ACTOR_ID = process.env.APIFY_ACTOR_ID // optional; user to set in env

export async function startApifyActor(params: StartActorParams): Promise<StartActorResult | null> {
  if (!APIFY_API_TOKEN || !APIFY_ACTOR_ID) return null
  const res = await fetch(`https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: params })
  })
  if (!res.ok) return null
  const data = await res.json()
  return { runId: data.data?.id || data.data?.defaultRunId || data.id }
}

export async function getRunStatus(runId: string): Promise<{ status: string; defaultDatasetId?: string } | null> {
  if (!APIFY_API_TOKEN) return null
  const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`)
  if (!res.ok) return null
  const data = await res.json()
  return { status: data.data?.status || data.status, defaultDatasetId: data.data?.defaultDatasetId }
}

export async function getDatasetItems(datasetId: string): Promise<any[] | null> {
  if (!APIFY_API_TOKEN) return null
  const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`)
  if (!res.ok) return null
  const data = await res.json()
  return Array.isArray(data) ? data : []
}
