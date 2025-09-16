import { detectPlatform } from './platform'

export interface VideoInfo {
  platform: 'youtube'
  id: string
}

export function extractVideoInfo(url: string): VideoInfo | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace('www.', '')
    const path = u.pathname
    const params = u.searchParams

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let id: string | null = null

      if (host.includes('youtu.be')) {
        id = path.split('/').filter(Boolean)[0] || null
      } else {
        id = params.get('v')
        if (!id && path.startsWith('/embed/')) id = path.split('/')[2] || null
        if (!id && path.startsWith('/shorts/')) id = path.split('/')[2] || null
      }

      if (id) return { platform: 'youtube', id }
    }
    return null
  } catch {
    return null
  }
}

export function getVideoThumbnail(videoInfo: VideoInfo): string {
  switch (videoInfo.platform) {
    case 'youtube':
      return `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`
    default:
      return `https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1024&h=1024&fit=crop&crop=center`
  }
}

export async function fetchYouTubeAuthor(videoUrl: string): Promise<string | null> {
  try {
    const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
    const res = await fetch(oembed)
    if (!res.ok) return null
    const data = await res.json()
    return typeof data?.author_name === 'string' ? data.author_name : null
  } catch {
    return null
  }
}

export interface AnalyzedRecipeResult {
  title?: string
  description?: string
  url?: string
  platform?: 'youtube'
  image?: string
  ingredients?: Array<{ name: string; amount?: string; unit?: string; notes?: string }>
  instructions?: Array<{ description: string; step_number?: number; image_url?: string; time_required?: number }>
  servings?: number
  prepTime?: number
  cookTime?: number
  tags?: string[]
}

export async function analyzeVideoForRecipe(imageUrl: string, videoUrl: string): Promise<AnalyzedRecipeResult | null> {
  const openAIApiKey = process.env.OPENAI_API_KEY
  if (!openAIApiKey) return null

  const prompt = `Analyze this image from a cooking video and extract a complete recipe. Return JSON with fields: title, description, ingredients (array of {name, amount, unit, notes}), instructions (array of {description}), servings, prepTime, cookTime, tags.`

  const requestBody = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 1500,
    temperature: 0.7
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) return null
  const data = await response.json().catch(() => null)
  const content = data?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') return null
  try {
    const jsonStart = content.indexOf('{')
    const jsonEnd = content.lastIndexOf('}')
    const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content
    const parsed = JSON.parse(jsonStr)
    return parsed
  } catch {
    return null
  }
}

export async function buildYouTubeRecipe(url: string) {
  const info = extractVideoInfo(url)
  if (!info) return null
  const thumbnail = getVideoThumbnail(info)
  // Try transcript+image analysis first; fall back to image-only
  const transcriptText = await fetchYouTubeTranscriptText(info.id)
  const analyzed = transcriptText
    ? await analyzeVideoForRecipeWithTranscript(thumbnail, url, transcriptText)
    : await analyzeVideoForRecipe(thumbnail, url)
  if (!analyzed) return null

  return {
    title: analyzed.title || 'Recipe from YouTube',
    description: analyzed.description || 'Recipe extracted from YouTube video',
    url,
    platform: 'youtube' as const,
    image: thumbnail,
    ingredients: analyzed.ingredients || [],
    instructions: (analyzed.instructions || []).map((it, idx) => ({
      description: it.description,
      step_number: it.step_number ?? idx + 1,
      image_url: it.image_url,
      time_required: it.time_required
    })),
    servings: analyzed.servings,
    prepTime: analyzed.prepTime,
    cookTime: analyzed.cookTime,
    tags: analyzed.tags || ['youtube']
  }
}

// Fetch transcript text via public transcript endpoint. Returns a single concatenated string or null.
export async function fetchYouTubeTranscriptText(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://youtubetranscript.rip/api/v1/video/${encodeURIComponent(videoId)}`)
    if (!res.ok) return null
    const data = await res.json().catch(() => null)
    if (!data) return null
    let segments: any[] | null = null
    if (Array.isArray(data)) segments = data
    else if (Array.isArray((data as any).transcripts?.[0]?.segments)) segments = (data as any).transcripts[0].segments
    else if (Array.isArray((data as any).segments)) segments = (data as any).segments
    if (!segments || segments.length === 0) return null
    const combined = segments
      .map((s: any) => typeof s?.text === 'string' ? s.text : (typeof s === 'string' ? s : ''))
      .filter(Boolean)
      .join(' ')
    return combined.length > 0 ? combined : null
  } catch {
    return null
  }
}

// Analyze with both thumbnail image and transcript text for higher accuracy
export async function analyzeVideoForRecipeWithTranscript(imageUrl: string, videoUrl: string, transcriptText: string): Promise<AnalyzedRecipeResult | null> {
  const openAIApiKey = process.env.OPENAI_API_KEY
  if (!openAIApiKey) return null

  const prompt = `You are a culinary assistant. Given a cooking video's transcript and a thumbnail image, extract a structured recipe. Return compact JSON with: title, description, ingredients (array of {name, amount?, unit?, notes?}), instructions (array of {description}), servings?, prepTime?, cookTime?, tags[].`

  const requestBody = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'text', text: `Video URL: ${videoUrl}` },
          { type: 'text', text: `Transcript (truncated):\n${transcriptText.slice(0, 6000)}` },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 1500,
    temperature: 0.5
  } as any

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) return null
  const data = await response.json().catch(() => null)
  const content = data?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') return null
  try {
    const jsonStart = content.indexOf('{')
    const jsonEnd = content.lastIndexOf('}')
    const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content
    const parsed = JSON.parse(jsonStr)
    return parsed
  } catch {
    return null
  }
}
