import { NextResponse } from "next/server";
import { scrapeRecipe, scrapeAndSaveRecipe, testUrlScraping } from "@/lib/scraping";

export async function POST(req: Request) {
  try {
    const { url, platform, userId } = await req.json().catch(() => ({}));
    
    // Validate required fields
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'url'." }, { status: 400 });
    }
    
    // Test URL first
    const urlTest = await testUrlScraping(url);
    if (!urlTest.success) {
      return NextResponse.json({ 
        error: urlTest.error || urlTest.message 
      }, { status: 400 });
    }

    const detectedPlatform = urlTest.platform!;

    // Guest mode: allow scraping without account for all platforms (no persistence)
    if (!userId || typeof userId !== "string") {
      const result = await scrapeRecipe(url, undefined, { guestMode: true });
      
      if (result.success && result.recipe) {
        return NextResponse.json({
          success: true,
          mode: 'guest',
          message: `${detectedPlatform.charAt(0).toUpperCase() + detectedPlatform.slice(1)} recipe extracted (not saved). Sign in to save recipes.`,
          recipe: result.recipe,
          confidence: result.confidence,
          warnings: result.warnings
        });
      } else {
        return NextResponse.json({
          error: result.error || `Failed to extract ${detectedPlatform} recipe`,
          mode: 'guest'
        }, { status: 400 });
      }
    }

    // Check if server is configured to access DB as admin
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY, cannot save or queue jobs.',
        hint: 'Add SUPABASE_SERVICE_ROLE_KEY to your environment and restart the server.',
      }, { status: 503 })
    }

    // Perform scraping with database integration
    const result = await scrapeAndSaveRecipe(url, userId);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: result.error 
      }, { status: result.error?.includes('already in progress') ? 409 : 400 });
    }

    return NextResponse.json({ 
      success: true,
      jobId: result.jobId,
      recipeId: result.recipeId,
      message: "Recipe extracted and saved successfully.",
      recipe: result.recipe,
      confidence: result.confidence,
      warnings: result.warnings
    });
    
  } catch (error) {
    console.error('Error in scrape POST:', error);
    
    return NextResponse.json({ 
      error: "Internal server error occurred while starting scraping job." 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter." }, { status: 400 });
    }
    
    // Ensure server is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY, cannot fetch jobs.',
        hint: 'Add SUPABASE_SERVICE_ROLE_KEY to your environment and restart the server.'
      }, { status: 503 })
    }

    // Import Supabase admin client
    const { supabaseAdmin } = await import('@/lib/supabase');

    // Fetch user's scraping jobs
    const { data: jobs, error } = await supabaseAdmin
      .from('scraping_jobs')
      .select('id, url, platform, status, created_at, result, error_message')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      return NextResponse.json({ error: "Failed to fetch scraping jobs." }, { status: 500 });
    }
    
    return NextResponse.json({ jobs: jobs || [] });
    
  } catch (error) {
    console.error('Error in scrape GET:', error);
    return NextResponse.json({ 
      error: "Internal server error occurred while fetching jobs." 
    }, { status: 500 });
  }
}