import { NextResponse } from 'next/server'
import { scrapeRecipe, detectPlatform } from '@/lib/scraping'

export async function POST(req: Request) {
  try {
    const { url, platform, userId } = await req.json()

    if (!url || !platform) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: url and platform'
      }, { status: 400 })
    }

    console.log(`Extracting recipe from ${platform} URL: ${url}`)

    // Validate platform matches URL
    const detectedPlatform = detectPlatform(url)
    if (detectedPlatform !== platform) {
      return NextResponse.json({
        success: false,
        error: `Platform mismatch: URL is for ${detectedPlatform || 'unknown'}, but ${platform} was specified`
      }, { status: 400 })
    }

    // Use unified scraping system (allow guest mode for all platforms)
    const result = await scrapeRecipe(url, userId, { 
      saveToDatabase: false,
      guestMode: true 
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to extract recipe data'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      recipe: result.recipe,
      method: result.method,
      confidence: result.confidence,
      warnings: result.warnings,
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