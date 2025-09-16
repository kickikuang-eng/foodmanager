# Social Media Recipe Scraping Implementation Guide

## Overview
This guide documents the complete process we used to successfully implement Instagram recipe scraping. Use this as a template for implementing YouTube and TikTok scraping.

## What We Built
A robust Instagram recipe scraper that:
- ✅ Extracts full recipe data (title, ingredients, instructions, author, video URL)
- ✅ Handles Instagram's rate limiting with intelligent caching
- ✅ Provides graceful fallbacks when scraping fails
- ✅ Parses ingredients and instructions from captions
- ✅ Returns structured recipe data ready for your application

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   API Routes     │───▶│   Scraping      │
│   (User Input)  │    │   /api/scrape    │    │   Functions     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Local          │    │   Apify         │
                       │   Functions      │    │   Integration   │
                       └──────────────────┘    └─────────────────┘
```

## Step-by-Step Implementation Process

### 1. Environment Setup

**File: `.env.local`**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Apify Configuration
APIFY_API_TOKEN=your_apify_token
APIFY_ACTOR_ID_INSTAGRAM=presetshubham/instagram-reel-downloader

# Other APIs
OPENAI_API_KEY=your_openai_key
```

**Key Points:**
- Keep environment variables clean (no JavaScript code)
- No duplicate variable definitions
- Proper formatting without line breaks in values

### 2. Core Scraping Function

**File: `src/lib/instagram-api.ts`**

```typescript
// Simple in-memory cache to avoid rate limiting
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function scrapeWithApify(url: string): Promise<{ caption?: string; author?: string; thumbnailUrl?: string }> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) throw new Error("APIFY_API_TOKEN is not set");

  // Check cache first
  const cacheKey = url;
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('Using cached result for:', url);
    return cached.data;
  }

  const actorId = process.env.APIFY_ACTOR_ID_INSTAGRAM || "apify~instagram-scraper";
  const actorSlug = encodeURIComponent(actorId);
  const isPresetReelActor = /presetshubham/i.test(actorId);
  
  // CRITICAL: Payload structure must match actor expectations
  const payload = isPresetReelActor
    ? {
        reelLinks: [url],
        proxy: 'none'
      }
    : {
        postUrls: [url],
        includeComments: true,
        includeLikes: true,
        includeHashtags: true,
        directUrls: [url]
      };

  // CRITICAL: Send payload directly, not wrapped in { input: payload }
  const actorRunResponse = await fetch(
    `https://api.apify.com/v2/acts/${actorSlug}/runs?token=${apiToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), // NOT { input: payload }
    }
  );

  if (!actorRunResponse.ok) {
    const errorText = await actorRunResponse.text();
    throw new Error(`Apify actor start failed: ${actorRunResponse.status} ${errorText}`);
  }

  const runData = await actorRunResponse.json();
  const runId = runData.data.id;

  // Wait for completion with timeout
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds timeout

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
      headers: { "Authorization": `Bearer ${apiToken}` }
    });
    
    const statusData = await statusResponse.json();
    const status = statusData.data.status;
    
    if (status === "SUCCEEDED") {
      const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items`, {
        headers: { "Authorization": `Bearer ${apiToken}` }
      });
      
      const results = await resultsResponse.json();
      
      if (results && results.length > 0) {
        const result = results[0];
        const extractedData = {
          caption: result.caption || result.description || null,
          author: result.owner_username || result.owner || result.username || null,
          thumbnailUrl: result.thumbnail || result.cover || result.video_url || null
        };
        
        // Cache the successful result
        cache.set(cacheKey, { data: extractedData, timestamp: Date.now() });
        return extractedData;
      }
    } else if (status === "FAILED") {
      throw new Error("Apify run failed");
    }
    
    attempts++;
  }
  
  // Fallback to cached data if rate limited
  const oldCached = cache.get(cacheKey);
  if (oldCached) {
    console.log('Returning old cached result due to rate limiting');
    return oldCached.data;
  }
  
  throw new Error("Apify run timeout");
}
```

**Key Implementation Points:**
1. **Caching is CRITICAL** - Instagram rate limits aggressively
2. **Payload structure matters** - Different actors expect different formats
3. **Don't wrap payload in `input`** - Send payload directly
4. **Handle rate limiting gracefully** - Return cached data when possible
5. **Proper timeout handling** - Don't wait indefinitely

### 3. Local API Route

**File: `src/app/api/extract-recipe-from-social/route.ts`**

```typescript
export async function POST(req: Request) {
  try {
    const { url, platform, userId } = await req.json()

    if (!url || !platform) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: url and platform'
      }, { status: 400 })
    }

    let recipeData = null

    if (platform === 'instagram') {
      recipeData = await extractInstagramRecipe(url)
    } else if (platform === 'tiktok') {
      recipeData = await extractTikTokRecipe(url)
    } else {
      return NextResponse.json({
        success: false,
        error: `Unsupported platform: ${platform}`
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      recipe: recipeData,
      method: 'local_function',
      platform,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in extract-recipe-from-social:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function extractInstagramRecipe(url: string) {
  try {
    console.log('Starting Instagram extraction for:', url)
    
    if (process.env.APIFY_API_TOKEN && process.env.APIFY_ACTOR_ID_INSTAGRAM) {
      console.log('Using Apify for Instagram scraping...')
      
      try {
        const { scrapeWithApify } = await import('@/lib/instagram-api')
        const apifyResult = await scrapeWithApify(url)
        
        if (apifyResult && (apifyResult.caption || apifyResult.author || apifyResult.thumbnailUrl)) {
          // Extract ingredients and instructions from caption
          const extractedInfo = extractRecipeFromText(apifyResult.caption || '')
          
          return {
            title: apifyResult.caption ? extractTitleFromCaption(apifyResult.caption) : 'Instagram Recipe',
            description: apifyResult.caption || 'Recipe from Instagram',
            url,
            platform: 'instagram',
            author: apifyResult.author,
            image: apifyResult.thumbnailUrl,
            caption: apifyResult.caption,
            thumbnailUrl: apifyResult.thumbnailUrl,
            ingredients: extractedInfo.ingredients,
            instructions: extractedInfo.instructions,
            tags: ['instagram', 'social-media']
          }
        }
      } catch (apifyError) {
        console.log('Apify Instagram scraping failed:', apifyError)
      }
    }

    // Fallback: create basic recipe
    return {
      title: 'Instagram Recipe',
      description: 'Recipe from Instagram. Please add ingredients and instructions manually.',
      url,
      platform: 'instagram',
      ingredients: [],
      instructions: ['Please add cooking instructions manually'],
      tags: ['instagram', 'social-media', 'fallback']
    }

  } catch (error) {
    console.error('Instagram extraction error:', error)
    return null
  }
}
```

### 4. Recipe Parsing Functions

**Enhanced Text Parsing:**
```typescript
function extractRecipeFromText(text: string) {
  const ingredients: string[] = []
  const instructions: string[] = []

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  let inIngredientsSection = false
  let inInstructionsSection = false
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    
    // Detect sections
    if (lowerLine.includes('ingredients:') || lowerLine.includes('ingredient:')) {
      inIngredientsSection = true
      inInstructionsSection = false
      continue
    }
    
    if (lowerLine.includes('instructions:') || lowerLine.includes('directions:') || lowerLine.includes('how to:')) {
      inInstructionsSection = true
      inIngredientsSection = false
      continue
    }
    
    // Stop at social media content
    if (lowerLine.includes('comment') || lowerLine.includes('like') || lowerLine.includes('follow') || 
        lowerLine.includes('@') || lowerLine.includes('#')) {
      inIngredientsSection = false
      inInstructionsSection = false
      continue
    }
    
    // Extract ingredients (lines starting with - or containing measurements)
    if (inIngredientsSection || line.match(/^[-•]\s/) || line.match(/\d+\s*(cup|tbsp|tsp|oz|lb|g|kg|ml|l|clove|slice|piece)/i)) {
      if (line.length > 3 && !line.match(/^[-•]\s*$/)) {
        ingredients.push(line.replace(/^[-•]\s*/, ''))
      }
    }
    
    // Extract instructions (numbered steps or lines with action words)
    if (inInstructionsSection || line.match(/^\d+\./) || 
        lowerLine.match(/(mix|combine|add|heat|cook|bake|fry|stir|chop|cut|season|marinate|prepare)/)) {
      if (line.length > 5) {
        instructions.push(line.replace(/^\d+\.\s*/, ''))
      }
    }
  }

  return { ingredients, instructions }
}

function extractTitleFromCaption(caption: string): string {
  const lines = caption.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  // Look for the first meaningful line as title
  for (const line of lines) {
    if (line.length > 5 && line.length < 100 && !line.startsWith('#')) {
      return line
    }
  }
  
  // Fallback to first 50 characters
  return caption.substring(0, 50).trim() + (caption.length > 50 ? '...' : '')
}
```

### 5. Main Scraping Orchestrator

**File: `src/lib/scraping.ts`**
```typescript
export async function scrapeRecipe(url: string, userId?: string): Promise<RecipeExtractionResult> {
  // Platform detection
  const platform = detectPlatform(url)
  if (!platform) {
    return {
      success: false,
      error: 'Unsupported platform',
      method: 'none',
      confidence: 0
    }
  }

  if (platform === 'instagram') {
    return await scrapeInstagram(url, userId)
  }
  
  // Add other platforms here...
}

async function scrapeInstagram(url: string, userId?: string): Promise<RecipeExtractionResult> {
  // Try local function first
  try {
    const response = await fetch('http://localhost:3000/api/extract-recipe-from-social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        platform: 'instagram',
        userId: userId || 'guest'
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.recipe) {
        return {
          success: true,
          recipe: { ...result.recipe, platform: 'instagram' },
          method: 'local_function',
          confidence: 0.8
        }
      }
    }
  } catch (error) {
    console.log('Local function failed:', error)
  }

  // Fallback implementations...
}
```

## Critical Success Factors

### 1. Payload Structure
- **Instagram**: `{ reelLinks: [url], proxy: 'none' }`
- **Different actors expect different formats**
- **NEVER wrap in `{ input: payload }`** - Send payload directly

### 2. Rate Limiting Management
- **Always implement caching** - 5-minute cache duration works well
- **Return cached data when rate limited**
- **Handle empty results gracefully**

### 3. Error Handling
- **Graceful fallbacks** for each step
- **Detailed logging** for debugging
- **Timeout handling** (30 seconds max)

### 4. Data Processing
- **Parse ingredients and instructions** from text
- **Extract meaningful titles** from captions
- **Handle social media noise** (hashtags, mentions, etc.)

## Common Pitfalls to Avoid

1. **❌ Wrong payload structure** - Always check actor documentation
2. **❌ No caching** - Instagram will block you immediately
3. **❌ Wrapping payload in `input`** - Most actors expect direct payload
4. **❌ No timeout handling** - Can hang indefinitely
5. **❌ Poor error handling** - Always provide fallbacks

## Testing Strategy

### 1. Test Individual Components
```bash
# Test Apify function directly
curl -X POST http://localhost:3000/api/test-apify-direct \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/p/EXAMPLE/"}'
```

### 2. Test Full Pipeline
```bash
# Test complete scraping
curl -X POST http://localhost:3000/api/test-scraping \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/p/EXAMPLE/"}'
```

### 3. Test Error Scenarios
- Invalid URLs
- Private posts
- Rate limiting
- Network failures

## Next Steps for YouTube and TikTok

### YouTube Implementation
1. **Find suitable Apify actor** for YouTube scraping
2. **Test payload structure** - likely `{ videoUrls: [url] }`
3. **Implement caching** - Same pattern as Instagram
4. **Parse video descriptions** for recipe data
5. **Extract video metadata** (duration, views, etc.)

### TikTok Implementation
1. **Find TikTok-specific Apify actor**
2. **Test with TikTok URLs** - Different format than Instagram
3. **Handle TikTok's different data structure**
4. **Parse TikTok captions** - Similar to Instagram but different format
5. **Extract video content** - TikTok videos are shorter

### Recommended Apify Actors
- **YouTube**: Search for "youtube-scraper" or "youtube-video-scraper"
- **TikTok**: Search for "tiktok-scraper" or "tiktok-video-scraper"

## File Structure
```
src/
├── lib/
│   ├── instagram-api.ts          # Instagram Apify integration
│   ├── youtube-api.ts            # YouTube Apify integration (to create)
│   ├── tiktok-api.ts             # TikTok Apify integration (to create)
│   └── scraping.ts               # Main orchestrator
├── app/
│   └── api/
│       ├── extract-recipe-from-social/
│       │   └── route.ts          # Local function API
│       └── test-scraping/
│           └── route.ts          # Testing endpoint
└── .env.local                    # Environment variables
```

This documentation provides everything you need to implement YouTube and TikTok scraping using the same successful pattern we used for Instagram!
