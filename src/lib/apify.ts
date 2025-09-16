export interface StartActorParams {
  url: string
  platform: 'youtube' | 'instagram' | 'tiktok'
}

export interface StartActorResult {
  runId: string
}

export interface RunStatus {
  status: string
  defaultDatasetId?: string
  stats?: {
    inputBodyLen: number
    restartCount: number
    resurrectionsCount: number
    retryCount: number
  }
  startedAt?: string
  finishedAt?: string
}

export interface ScrapedRecipeData {
  title?: string
  description?: string
  url?: string
  platform?: string
  image?: string
  ingredients?: string[]
  instructions?: string[]
  servings?: number
  prepTime?: number
  cookTime?: number
  tags?: string[]
  author?: string
  duration?: number
  views?: number
  likes?: number
}

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN
const APIFY_ACTOR_ID = process.env.APIFY_ACTOR_ID
const APIFY_ACTOR_ID_YOUTUBE = process.env.APIFY_ACTOR_ID_YOUTUBE
const APIFY_ACTOR_ID_INSTAGRAM = process.env.APIFY_ACTOR_ID_INSTAGRAM
const APIFY_ACTOR_ID_TIKTOK = process.env.APIFY_ACTOR_ID_TIKTOK
const APIFY_ACTOR_ID_DEFAULT = process.env.APIFY_ACTOR_ID_DEFAULT

export class ApifyError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApifyError'
  }
}

function validateConfiguration(): void {
  if (!APIFY_API_TOKEN) {
    throw new ApifyError('APIFY_API_TOKEN is not configured')
  }
  // Check if at least one actor ID is configured
  if (!APIFY_ACTOR_ID && !APIFY_ACTOR_ID_YOUTUBE && !APIFY_ACTOR_ID_INSTAGRAM && !APIFY_ACTOR_ID_TIKTOK && !APIFY_ACTOR_ID_DEFAULT) {
    throw new ApifyError('No APIFY_ACTOR_ID is configured. Please set at least one actor ID.')
  }
}

function getActorIdForPlatform(platform: 'youtube' | 'instagram' | 'tiktok'): string {
  // Try platform-specific actor first
  switch (platform) {
    case 'youtube':
      if (APIFY_ACTOR_ID_YOUTUBE) return APIFY_ACTOR_ID_YOUTUBE
      break
    case 'instagram':
      if (APIFY_ACTOR_ID_INSTAGRAM) return APIFY_ACTOR_ID_INSTAGRAM
      break
    case 'tiktok':
      if (APIFY_ACTOR_ID_TIKTOK) return APIFY_ACTOR_ID_TIKTOK
      break
  }
  
  // Fallback to default actor or main actor
  if (APIFY_ACTOR_ID_DEFAULT) return APIFY_ACTOR_ID_DEFAULT
  if (APIFY_ACTOR_ID) return APIFY_ACTOR_ID
  
  throw new ApifyError(`No actor configured for platform: ${platform}`)
}

export async function startApifyActor(params: StartActorParams): Promise<StartActorResult> {
  try {
    validateConfiguration()
    
    // Validate input parameters
    if (!params.url || !params.platform) {
      throw new ApifyError('Missing required parameters: url and platform')
    }
    
    const actorId = getActorIdForPlatform(params.platform)
    
    const response = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: {
            url: params.url,
            platform: params.platform,
            maxResults: 1, // Only need one result per URL
            includeComments: false,
            includeMetadata: true,
            // Recipe-specific parameters
            extractRecipe: true,
            lookForIngredients: true,
            lookForInstructions: true,
            extractText: true,
            // Platform-specific parameters
            ...(params.platform === 'tiktok' && {
              includeVideoDescription: true,
              includeComments: true,
              maxComments: 50
            }),
            ...(params.platform === 'youtube' && {
              includeVideoDescription: true,
              includeTranscript: true
            }),
            ...(params.platform === 'instagram' && {
              // Use different input format based on actor type
              ...(process.env.APIFY_ACTOR_ID_INSTAGRAM?.includes('presetshubham') ? {
                // For presetshubham actor, use minimal input
                reelLinks: [params.url]
              } : {
                // For other Instagram actors
                postUrls: [params.url],
                includeComments: true,
                includeLikes: true,
                includeHashtags: true,
                maxResults: 1,
                // Facebook API credentials for enhanced access
                ...(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET && {
                  facebookAppId: process.env.FACEBOOK_APP_ID,
                  facebookAppSecret: process.env.FACEBOOK_APP_SECRET
                })
              })
            })
          }
        })
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const details = typeof errorData?.error?.message === 'string' ? ` - ${errorData.error.message}` : ''
      throw new ApifyError(
        `Failed to start Apify actor: ${response.statusText} (actor=${actorId}, status=${response.status})${details}`,
        response.status,
        errorData
      )
    }
    
    const data = await response.json()
    const runId = data.data?.id || data.data?.defaultRunId || data.id
    
    if (!runId) {
      throw new ApifyError('No run ID returned from Apify API', response.status, data)
    }
    
    return { runId }
    
  } catch (error) {
    if (error instanceof ApifyError) {
      throw error
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new ApifyError(`Unexpected error starting Apify actor: ${errorMessage}`)
  }
}

export async function getRunStatus(runId: string): Promise<RunStatus> {
  try {
    validateConfiguration()
    
    if (!runId) {
      throw new ApifyError('Run ID is required')
    }
    
    const response = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApifyError(
        `Failed to get run status: ${response.statusText}`,
        response.status,
        errorData
      )
    }
    
    const data = await response.json()
    const status = data.data?.status || data.status
    const defaultDatasetId = data.data?.defaultDatasetId || data.defaultDatasetId
    
    if (!status) {
      throw new ApifyError('No status returned from Apify API', response.status, data)
    }
    
    return {
      status,
      defaultDatasetId,
      stats: data.data?.stats || data.stats,
      startedAt: data.data?.startedAt || data.startedAt,
      finishedAt: data.data?.finishedAt || data.finishedAt
    }
    
  } catch (error) {
    if (error instanceof ApifyError) {
      throw error
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new ApifyError(`Unexpected error getting run status: ${errorMessage}`)
  }
}

export async function getDatasetItems(datasetId: string): Promise<ScrapedRecipeData[]> {
  try {
    validateConfiguration()
    
    if (!datasetId) {
      throw new ApifyError('Dataset ID is required')
    }
    
    const response = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApifyError(
        `Failed to get dataset items: ${response.statusText}`,
        response.status,
        errorData
      )
    }
    
    const data = await response.json()
    
    if (!Array.isArray(data)) {
      throw new ApifyError('Invalid dataset format returned from Apify API', response.status, data)
    }
    
    // Validate and normalize the scraped data
    return data.map(validateAndNormalizeRecipeData)
    
  } catch (error) {
    if (error instanceof ApifyError) {
      throw error
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new ApifyError(`Unexpected error getting dataset items: ${errorMessage}`)
  }
}

function validateAndNormalizeRecipeData(item: any): ScrapedRecipeData {
  if (!item || typeof item !== 'object') {
    throw new ApifyError('Invalid recipe data format')
  }
  
  return {
    title: typeof item.title === 'string' ? item.title.trim() : undefined,
    description: typeof item.description === 'string' ? item.description.trim() : undefined,
    url: typeof item.url === 'string' ? item.url.trim() : undefined,
    platform: typeof item.platform === 'string' ? item.platform.toLowerCase() : undefined,
    image: typeof item.image === 'string' ? item.image.trim() : undefined,
    ingredients: Array.isArray(item.ingredients) 
      ? item.ingredients.filter((ing: any) => typeof ing === 'string').map((ing: any) => ing.trim())
      : undefined,
    instructions: Array.isArray(item.instructions)
      ? item.instructions.filter((inst: any) => typeof inst === 'string').map((inst: any) => inst.trim())
      : undefined,
    servings: typeof item.servings === 'number' ? item.servings : undefined,
    prepTime: typeof item.prepTime === 'number' ? item.prepTime : undefined,
    cookTime: typeof item.cookTime === 'number' ? item.cookTime : undefined,
    tags: Array.isArray(item.tags)
      ? item.tags.filter((tag: any) => typeof tag === 'string').map((tag: any) => tag.trim())
      : undefined,
    author: typeof item.author === 'string' ? item.author.trim() : undefined,
    duration: typeof item.duration === 'number' ? item.duration : undefined,
    views: typeof item.views === 'number' ? item.views : undefined,
    likes: typeof item.likes === 'number' ? item.likes : undefined
  }
}
