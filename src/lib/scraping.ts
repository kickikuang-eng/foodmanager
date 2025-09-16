/**
 * Simplified scraping module - consolidated functionality
 */

export type SupportedPlatform = 'youtube' | 'instagram' | 'tiktok'
export type ScrapingMethod = 'direct' | 'api' | 'apify' | 'supabase_function' | 'local_function' | 'fallback'

export interface ScrapedRecipeData {
  title?: string
  description?: string
  url?: string
  platform?: SupportedPlatform
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
  caption?: string
  thumbnailUrl?: string
  postId?: string
  hashtags?: string[]
}

export interface RecipeExtractionResult {
  success: boolean
  recipe?: ScrapedRecipeData
  error?: string
  method: ScrapingMethod
  confidence?: number
  warnings?: string[]
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): SupportedPlatform | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.replace('www.', '').toLowerCase()
    
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube'
    }
    
    if (hostname.includes('instagram.com')) {
      return 'instagram'
    }
    
    if (hostname.includes('tiktok.com')) {
      return 'tiktok'
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Main scraping function - unified interface for all platforms
 */
export async function scrapeRecipe(
  url: string, 
  userId?: string,
  options: {
    saveToDatabase?: boolean
    guestMode?: boolean
    requireAuth?: boolean
  } = {}
): Promise<RecipeExtractionResult> {
  try {
    // Detect platform
    const platform = detectPlatform(url)
    if (!platform) {
      return {
        success: false,
        error: 'Unsupported platform',
        method: 'fallback'
      }
    }

    // Guest mode is now allowed for all platforms
    // No restrictions - all platforms can be scraped without authentication

    // Route to platform-specific scraping
    switch (platform) {
      case 'youtube':
        return await scrapeYouTube(url, userId, options)
      case 'instagram':
        return await scrapeInstagram(url, userId, options)
      case 'tiktok':
        return await scrapeTikTok(url, userId, options)
      default:
        return {
          success: false,
          error: 'Platform not implemented',
          method: 'fallback'
        }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      method: 'fallback'
    }
  }
}

/**
 * Enhanced scraping with database integration
 */
export async function scrapeAndSaveRecipe(
  url: string,
  userId: string
): Promise<RecipeExtractionResult & { recipeId?: string; jobId?: string }> {
  try {
    // Import Supabase admin client
    const { supabaseAdmin } = await import('./supabase')
    
    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not found',
        method: 'fallback'
      }
    }

    // Check for existing job
    const { data: existingJob } = await supabaseAdmin
      .from('scraping_jobs')
      .select('id, status')
      .eq('user_id', userId)
      .eq('url', url)
      .eq('status', 'pending')
      .single()
    
    if (existingJob) {
      return {
        success: false,
        error: 'A scraping job for this URL is already in progress',
        method: 'fallback',
        jobId: existingJob.id
      }
    }

    // Perform scraping
    const result = await scrapeRecipe(url, userId, { saveToDatabase: true })
    
    if (!result.success || !result.recipe) {
      return result
    }

    // Save to database
    const { data: insertedRecipe, error: recErr } = await supabaseAdmin
      .from('recipes')
      .insert({
        user_id: userId,
        title: result.recipe.title,
        description: result.recipe.description,
        source_url: result.recipe.url,
        source_platform: result.recipe.platform,
        thumbnail_url: result.recipe.image || result.recipe.thumbnailUrl,
        ingredients: result.recipe.ingredients,
        instructions: result.recipe.instructions,
        servings: result.recipe.servings,
        prep_time: result.recipe.prepTime,
        cook_time: result.recipe.cookTime,
        difficulty: 'medium',
        tags: result.recipe.tags
      })
      .select('id')
      .single()

    if (recErr || !insertedRecipe) {
      return {
        ...result,
        error: 'Failed to save recipe to database',
        success: false
      }
    }

    // Create scraping job record
    const { data: job, error: jobError } = await supabaseAdmin
      .from('scraping_jobs')
      .insert({
        user_id: userId,
        url,
        platform: result.recipe.platform,
        status: 'completed',
        result: { recipeId: insertedRecipe.id }
      })
      .select('id')
      .single()

    if (jobError || !job) {
      console.warn('Failed to create scraping job record:', jobError)
    }

    return {
      ...result,
      recipeId: insertedRecipe.id,
      jobId: job?.id
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      method: 'fallback'
    }
  }
}

/**
 * YouTube scraping
 */
async function scrapeYouTube(url: string, userId?: string, options: any = {}): Promise<RecipeExtractionResult> {
  try {
    // Import existing YouTube utilities
    const { buildYouTubeRecipe, extractVideoInfo, getVideoThumbnail, fetchYouTubeAuthor } = await import('./youtube')
    
    // Try to build recipe using existing logic
    const recipe = await buildYouTubeRecipe(url)
    
    if (recipe) {
      return {
        success: true,
        recipe: {
          ...recipe,
          platform: 'youtube',
          // Convert complex ingredients to simple strings
          ingredients: recipe.ingredients?.map((ing: any) => 
            typeof ing === 'string' ? ing : 
            `${ing.amount || ''} ${ing.unit || ''} ${ing.name}`.trim()
          ) || [],
          // Convert complex instructions to simple strings
          instructions: recipe.instructions?.map((inst: any) => 
            typeof inst === 'string' ? inst : inst.description
          ) || []
        },
        method: 'direct',
        confidence: 0.8
      }
    }

    // Fallback: create basic recipe from video info
    const videoInfo = extractVideoInfo(url)
    if (videoInfo) {
      const thumbnail = getVideoThumbnail(videoInfo)
      const author = await fetchYouTubeAuthor(url)
      
      return {
        success: true,
        recipe: {
          title: author ? `${author} - Recipe Video` : 'YouTube Recipe Video',
          description: 'Recipe extracted from YouTube video. Please add ingredients and instructions manually.',
          url,
          platform: 'youtube',
          image: thumbnail,
          author: author || undefined,
          ingredients: [],
          instructions: ['Please add cooking instructions manually'],
          tags: ['youtube', 'video']
        },
        method: 'direct',
        confidence: 0.3,
        warnings: ['Limited recipe information available']
      }
    }

    return {
      success: false,
      error: 'Could not extract video information',
      method: 'direct'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'YouTube scraping failed',
      method: 'direct'
    }
  }
}

/**
 * Instagram scraping - Apify as primary method (just like instagram-api.ts)
 */
async function scrapeInstagram(url: string, userId?: string, options: any = {}): Promise<RecipeExtractionResult> {
  console.log('Instagram scraping started for URL:', url);
  console.log('Apify API token available:', !!process.env.APIFY_API_TOKEN);
  console.log('Instagram actor ID:', process.env.APIFY_ACTOR_ID_INSTAGRAM);
  
  // Use Apify as the primary method (just like instagram-api.ts)
  if (process.env.APIFY_API_TOKEN && process.env.APIFY_ACTOR_ID_INSTAGRAM) {
    try {
      // Use the working Apify logic directly from instagram-api.ts
      const { scrapeWithApify } = await import('./instagram-api');
      const scrapedData = await scrapeWithApify(url);
      
      console.log('Apify scraping result:', scrapedData);

      if (scrapedData && (scrapedData.caption || scrapedData.author || scrapedData.thumbnailUrl)) {
        // Extract ingredients and instructions from caption
        const extractedInfo = extractRecipeFromText(scrapedData.caption || '');
        
        return {
          success: true,
          recipe: {
            title: scrapedData.caption ? extractTitleFromCaption(scrapedData.caption) : 'Instagram Recipe',
            description: scrapedData.caption || 'Recipe from Instagram',
            url,
            platform: 'instagram',
            author: scrapedData.author,
            image: scrapedData.thumbnailUrl,
            caption: scrapedData.caption,
            thumbnailUrl: scrapedData.thumbnailUrl,
            ingredients: extractedInfo.ingredients,
            instructions: extractedInfo.instructions,
            tags: ['instagram', 'social-media']
          },
          method: 'apify',
          confidence: 0.8,
          warnings: scrapedData.caption ? [] : ['No caption found - limited recipe information']
        }
      } else {
        console.log('Apify returned no useful data - post may be private or not accessible');
      }
    } catch (error) {
      console.error('Instagram Apify scraping error:', error);
    }
  } else {
    console.log('Apify not configured - missing API token or actor ID');
  }

  // Note: Instagram Basic Display API fallback removed since Apify is the primary method
  // If Apify fails, we'll create a basic recipe as fallback

  // Final fallback: create basic recipe from URL
  return {
    success: true,
    recipe: {
      title: 'Instagram Recipe',
      description: 'Recipe from Instagram. Please add ingredients and instructions manually.',
      url,
      platform: 'instagram',
      ingredients: [],
      instructions: ['Please add cooking instructions manually'],
      tags: ['instagram', 'social-media', 'fallback']
    },
    method: 'fallback',
    confidence: 0.1,
    warnings: ['Limited information available - Instagram scraping in progress']
  }
}


/**
 * Extract recipe information from text (ingredients and instructions)
 */
function extractRecipeFromText(text: string) {
  const ingredients: string[] = [];
  const instructions: string[] = [];

  // Split text into lines and clean them
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let inIngredientsSection = false;
  let inInstructionsSection = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Detect sections
    if (lowerLine.includes('ingredients:') || lowerLine.includes('ingredient:')) {
      inIngredientsSection = true;
      inInstructionsSection = false;
      continue;
    }
    
    if (lowerLine.includes('instructions:') || lowerLine.includes('directions:') || lowerLine.includes('how to:')) {
      inInstructionsSection = true;
      inIngredientsSection = false;
      continue;
    }
    
    // Stop at certain keywords
    if (lowerLine.includes('comment') || lowerLine.includes('like') || lowerLine.includes('follow') || 
        lowerLine.includes('@') || lowerLine.includes('#')) {
      inIngredientsSection = false;
      inInstructionsSection = false;
      continue;
    }
    
    // Extract ingredients (lines starting with - or containing measurements)
    if (inIngredientsSection || line.match(/^[-•]\s/) || line.match(/\d+\s*(cup|tbsp|tsp|oz|lb|g|kg|ml|l|clove|slice|piece)/i)) {
      if (line.length > 3 && !line.match(/^[-•]\s*$/)) {
        ingredients.push(line.replace(/^[-•]\s*/, ''));
      }
    }
    
    // Extract instructions (numbered steps or lines with action words)
    if (inInstructionsSection || line.match(/^\d+\./) || 
        lowerLine.match(/(mix|combine|add|heat|cook|bake|fry|stir|chop|cut|season|marinate|prepare)/)) {
      if (line.length > 5) {
        instructions.push(line.replace(/^\d+\.\s*/, ''));
      }
    }
  }

  return { ingredients, instructions };
}

/**
 * TikTok scraping
 */
async function scrapeTikTok(url: string, userId?: string, options: any = {}): Promise<RecipeExtractionResult> {
  console.log('Apify API token available:', !!process.env.APIFY_API_TOKEN);
  console.log('TikTok actor ID:', process.env.APIFY_ACTOR_ID_TIKTOK);

  // Use Apify for TikTok scraping
  if (process.env.APIFY_API_TOKEN && process.env.APIFY_ACTOR_ID_TIKTOK) {
    try {
      // Use the same Apify logic as Instagram
      const { scrapeWithApify } = await import('./instagram-api');
      const scrapedData = await scrapeWithApify(url);

      console.log('TikTok Apify scraping result:', scrapedData);

      if (scrapedData && (scrapedData.caption || scrapedData.author || scrapedData.thumbnailUrl)) {
        // Extract ingredients and instructions from caption
        const extractedInfo = extractRecipeFromText(scrapedData.caption || '');

        return {
          success: true,
          recipe: {
            title: scrapedData.caption ? extractTitleFromCaption(scrapedData.caption) : 'TikTok Recipe',
            description: scrapedData.caption || 'Recipe from TikTok',
            url,
            platform: 'tiktok',
            author: scrapedData.author,
            image: scrapedData.thumbnailUrl,
            caption: scrapedData.caption,
            thumbnailUrl: scrapedData.thumbnailUrl,
            ingredients: extractedInfo.ingredients,
            instructions: extractedInfo.instructions,
            tags: ['tiktok', 'social-media']
          },
          method: 'apify',
          confidence: 0.8,
          warnings: scrapedData.caption ? [] : ['No caption found - limited recipe information']
        }
      } else {
        console.log('TikTok Apify returned no useful data - video may be private or not accessible');
      }
    } catch (error) {
      console.error('TikTok Apify scraping error:', error);
    }
  } else {
    console.log('TikTok Apify not configured - missing API token or actor ID');
  }

  // Fallback: create basic recipe
  return {
    success: true,
    recipe: {
      title: 'TikTok Recipe Video',
      description: 'Recipe from TikTok video. TikTok has strong anti-scraping measures, so limited information is available. Please add ingredients and instructions manually.',
      url,
      platform: 'tiktok',
      ingredients: [],
      instructions: ['Please add cooking instructions manually'],
      tags: ['tiktok', 'video', 'fallback']
    },
    method: 'fallback',
    confidence: 0.1,
    warnings: ['Limited information available due to TikTok restrictions']
  }
}

/**
 * Extract title from caption
 */
function extractTitleFromCaption(caption: string): string {
  const lines = caption.split('\n')
  const firstLine = lines[0]?.trim()
  
  if (firstLine && firstLine.length < 100) {
    return firstLine
  }
  
  const sentences = caption.split(/[.!?]/)
  const firstSentence = sentences[0]?.trim()
  
  if (firstSentence && firstSentence.length < 100) {
    return firstSentence
  }
  
  return 'Instagram Recipe'
}

/**
 * Test if a URL can be processed
 */
export async function testUrlScraping(url: string): Promise<{
  success: boolean
  message: string
  platform?: string
  error?: string
}> {
  try {
    if (!isValidUrl(url)) {
      return {
        success: false,
        message: 'Invalid URL format',
        error: 'URL is not valid'
      }
    }

    const platform = detectPlatform(url)
    if (!platform) {
      return {
        success: false,
        message: 'Unsupported platform',
        error: 'URL must be from YouTube, Instagram, or TikTok'
      }
    }

    return {
      success: true,
      message: `URL is valid for ${platform} scraping`,
      platform
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error testing URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
