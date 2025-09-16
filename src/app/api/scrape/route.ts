import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { startApifyActor, ApifyError } from "@/lib/apify";
import { detectPlatform, isValidUrl } from "@/lib/platform";
import { buildYouTubeRecipe, extractVideoInfo, getVideoThumbnail, fetchYouTubeAuthor } from "@/lib/youtube";

export async function POST(req: Request) {
  try {
    const { url, platform, userId } = await req.json().catch(() => ({}));
    
    // Validate required fields
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'url'." }, { status: 400 });
    }
    
    // Validate URL format
    if (!isValidUrl(url)) {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }
    
    // Detect platform if not provided
    const detectedPlatform = platform || detectPlatform(url);
    if (!detectedPlatform) {
      return NextResponse.json({ 
        error: "URL must be from a supported platform (YouTube, Instagram, or TikTok)." 
      }, { status: 400 });
    }

    // Guest mode: allow scraping without account for YouTube only (no persistence)
    if (!userId || typeof userId !== "string") {
      if (detectedPlatform === 'youtube') {
        if (!process.env.OPENAI_API_KEY) {
          return NextResponse.json({
            error: 'Server is missing OPENAI_API_KEY, cannot extract YouTube recipe in guest mode.',
            hint: 'Add OPENAI_API_KEY to your environment or sign in to save and process later.'
          }, { status: 503 })
        }
        const recipe = await buildYouTubeRecipe(url)
        if (!recipe) {
          // Fallback: build a minimal preview so the guest flow still works
          const info = extractVideoInfo(url)
          const image = info ? getVideoThumbnail(info) : undefined
          const author = await fetchYouTubeAuthor(url)
          const fallback = {
            title: author ? `${author} - Recipe Preview` : 'Recipe from YouTube',
            description: 'Preview generated from video thumbnail. Sign in to save.',
            url,
            platform: 'youtube' as const,
            image,
            ingredients: [],
            instructions: []
          }
          return NextResponse.json({ success: true, mode: 'guest', message: 'Showing basic preview. Sign in to save.', recipe: fallback })
        }
        return NextResponse.json({
          success: true,
          mode: 'guest',
          message: 'YouTube recipe extracted (not saved). Sign in to save recipes.',
          recipe
        })
      }
      return NextResponse.json({
        error: 'Sign in required to scrape non-YouTube sources.',
      }, { status: 401 })
    }
    
    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    
    // Check for existing job with same URL and user
    const { data: existingJob } = await supabaseAdmin
      .from('scraping_jobs')
      .select('id, status')
      .eq('user_id', userId)
      .eq('url', url)
      .eq('status', 'pending')
      .single();
    
    if (existingJob) {
      return NextResponse.json({ 
        error: "A scraping job for this URL is already in progress.",
        jobId: existingJob.id 
      }, { status: 409 });
    }
    
    // If YouTube, attempt direct extraction; if it fails, fall back to Apify queue
    if (detectedPlatform === 'youtube') {
      let recipe = null as any
      if (process.env.OPENAI_API_KEY) {
        try { recipe = await buildYouTubeRecipe(url) } catch { recipe = null }
      }

      if (recipe) {
        const { data: insertedRecipe, error: recErr } = await supabaseAdmin
          .from('recipes')
          .insert({
            user_id: userId,
            title: recipe.title,
            description: recipe.description,
            source_url: recipe.url,
            source_platform: recipe.platform,
            thumbnail_url: recipe.image,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            servings: recipe.servings,
            prep_time: recipe.prepTime,
            cook_time: recipe.cookTime,
            difficulty: 'medium',
            tags: recipe.tags
          })
          .select('id')
          .single()

        if (recErr || !insertedRecipe) {
          return NextResponse.json({ error: "Failed to save YouTube recipe." }, { status: 500 })
        }

        const { data: job, error: jobError } = await supabaseAdmin
          .from('scraping_jobs')
          .insert({
            user_id: userId,
            url,
            platform: detectedPlatform,
            status: 'completed',
            result: { recipeId: insertedRecipe.id }
          })
          .select('id')
          .single()

        if (jobError || !job) {
          return NextResponse.json({ error: "Failed to create scraping job in database." }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true,
          jobId: job.id,
          message: "YouTube recipe extracted and saved.",
          recipeId: insertedRecipe.id
        })
      }

      // Fallback to Apify processing
      try {
        const apifyResult = await startApifyActor({ url, platform: 'youtube' })
        const { data: job, error: jobError } = await supabaseAdmin
          .from('scraping_jobs')
          .insert({
            user_id: userId,
            url,
            platform: 'youtube',
            status: 'processing',
            result: { apifyRunId: apifyResult.runId }
          })
          .select('id')
          .single()
        if (jobError || !job) {
          return NextResponse.json({ error: 'Failed to create scraping job in database.' }, { status: 500 })
        }
        return NextResponse.json({ success: true, jobId: job.id, message: "YouTube extraction queued. We'll notify when it's done." })
      } catch (e) {
        const message = e instanceof ApifyError ? e.message : 'Failed to start YouTube scraping.'
        return NextResponse.json({ error: message }, { status: 502 })
      }
    }

    // For Instagram, try Instagram API first, fallback to Apify
    if (detectedPlatform === 'instagram') {
      try {
        // Try Instagram API first
        const instagramResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/instagram/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, userId })
        });
        
        if (instagramResponse.ok) {
          const instagramResult = await instagramResponse.json();
          return NextResponse.json({
            success: true,
            method: 'instagram_api',
            recipeId: instagramResult.recipeId,
            message: "Instagram recipe extracted using official API."
          });
        }
        
        // If Instagram API fails, fall back to Apify
        console.log('Instagram API failed, falling back to Apify scraping');
      } catch (error) {
        console.log('Instagram API error, falling back to Apify scraping:', error);
      }
    }

    // For non-YouTube and Instagram API failures, start Apify actor
    const apifyResult = await startApifyActor({ url, platform: detectedPlatform });

    // Create scraping job in database
    const { data: job, error: jobError } = await supabaseAdmin
      .from('scraping_jobs')
      .insert({
        user_id: userId,
        url,
        platform: detectedPlatform,
        status: 'processing',
        result: { apifyRunId: apifyResult.runId }
      })
      .select('id')
      .single();
    
    if (jobError || !job) {
      return NextResponse.json({ 
        error: "Failed to create scraping job in database." 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      jobId: job.id,
      message: "Scraping job started successfully." 
    });
    
  } catch (error) {
    console.error('Error in scrape POST:', error);
    
    if (error instanceof ApifyError) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: error.statusCode || 500 });
    }
    
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