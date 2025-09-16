import { NextRequest, NextResponse } from 'next/server';
import { 
  getInstagramMediaById, 
  extractRecipeFromInstagramPost, 
  extractInstagramMediaId,
  isValidInstagramUrl,
  InstagramAPIError 
} from '@/lib/instagram-api';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/instagram/scrape
 * Scrape Instagram post using Instagram Basic Display API
 */
export async function POST(request: NextRequest) {
  try {
    const { url, userId } = await request.json();
    
    if (!url || !userId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: url, userId' 
      }, { status: 400 });
    }
    
    // Validate Instagram URL
    if (!isValidInstagramUrl(url)) {
      return NextResponse.json({ 
        error: 'Invalid Instagram URL format' 
      }, { status: 400 });
    }
    
    // Extract media ID from URL
    const mediaId = extractInstagramMediaId(url);
    if (!mediaId) {
      return NextResponse.json({ 
        error: 'Could not extract Instagram post ID from URL' 
      }, { status: 400 });
    }
    
    // Get user's Instagram credentials
    const { data: instagramAuth, error: authError } = await supabaseAdmin
      .from('instagram_auth')
      .select('access_token, instagram_username')
      .eq('user_id', userId)
      .single();
    
    if (authError || !instagramAuth) {
      return NextResponse.json({
        error: 'Instagram account not connected. Please connect your Instagram account first.',
        requiresAuth: true
      }, { status: 401 });
    }
    
    // Get Instagram post data
    const instagramPost = await getInstagramMediaById(mediaId, instagramAuth.access_token);
    
    // Extract recipe data
    const recipeData = extractRecipeFromInstagramPost(instagramPost);
    recipeData.author = instagramAuth.instagram_username;
    
    // Save recipe to database
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('recipes')
      .insert({
        user_id: userId,
        title: recipeData.title,
        description: recipeData.description,
        source_url: recipeData.url,
        source_platform: 'instagram',
        thumbnail_url: recipeData.thumbnail,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        difficulty: 'medium',
        tags: ['instagram', 'social-media']
      })
      .select('id')
      .single();
    
    if (recipeError) {
      console.error('Error saving recipe:', recipeError);
      return NextResponse.json({ 
        error: 'Failed to save recipe to database' 
      }, { status: 500 });
    }
    
    // Create scraping job record
    const { error: jobError } = await supabaseAdmin
      .from('scraping_jobs')
      .insert({
        user_id: userId,
        url,
        platform: 'instagram',
        status: 'completed',
        result: { 
          recipeId: recipe.id,
          method: 'instagram_api',
          instagramPostId: mediaId
        }
      });
    
    if (jobError) {
      console.error('Error creating scraping job:', jobError);
      // Don't fail the request for this
    }
    
    return NextResponse.json({
      success: true,
      recipeId: recipe.id,
      recipe: recipeData,
      method: 'instagram_api',
      message: 'Instagram recipe extracted and saved successfully'
    });
    
  } catch (error) {
    console.error('Error scraping Instagram post:', error);
    
    if (error instanceof InstagramAPIError) {
      if (error.code === 190) { // Invalid access token
        return NextResponse.json({
          error: 'Instagram access token expired. Please reconnect your Instagram account.',
          requiresReauth: true
        }, { status: 401 });
      }
      
      if (error.code === 100) { // Invalid parameter
        return NextResponse.json({
          error: 'Instagram post not found or not accessible',
          requiresAuth: true
        }, { status: 404 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to scrape Instagram post' 
    }, { status: 500 });
  }
}

/**
 * GET /api/instagram/scrape
 * Get user's Instagram posts for recipe extraction
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '25');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }
    
    // Get user's Instagram credentials
    const { data: instagramAuth, error: authError } = await supabaseAdmin
      .from('instagram_auth')
      .select('access_token, instagram_username')
      .eq('user_id', userId)
      .single();
    
    if (authError || !instagramAuth) {
      return NextResponse.json({
        error: 'Instagram account not connected',
        requiresAuth: true
      }, { status: 401 });
    }
    
    // Get user's Instagram media
    const { getInstagramMedia } = await import('@/lib/instagram-api');
    const instagramPosts = await getInstagramMedia(instagramAuth.access_token, limit);
    
    // Filter posts that might contain recipes
    const potentialRecipes = instagramPosts.filter(post => {
      const caption = post.caption || '';
      const lowerCaption = caption.toLowerCase();
      
      return (
        lowerCaption.includes('recipe') ||
        lowerCaption.includes('ingredients') ||
        lowerCaption.includes('cook') ||
        lowerCaption.includes('bake') ||
        lowerCaption.includes('food') ||
        lowerCaption.includes('delicious')
      );
    });
    
    return NextResponse.json({
      success: true,
      posts: potentialRecipes.map(post => ({
        id: post.id,
        caption: post.caption,
        media_url: post.media_url,
        permalink: post.permalink,
        timestamp: post.timestamp,
        media_type: post.media_type
      })),
      total: instagramPosts.length,
      potentialRecipes: potentialRecipes.length
    });
    
  } catch (error) {
    console.error('Error getting Instagram posts:', error);
    
    if (error instanceof InstagramAPIError) {
      if (error.code === 190) { // Invalid access token
        return NextResponse.json({
          error: 'Instagram access token expired. Please reconnect your Instagram account.',
          requiresReauth: true
        }, { status: 401 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to get Instagram posts' 
    }, { status: 500 });
  }
}
