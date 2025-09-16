import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req)=>{
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    const apikey = req.headers.get('apikey');
    
    console.log('Auth header present:', !!authHeader);
    console.log('Apikey present:', !!apikey);
    const { url, platform, userId } = await req.json();
    if (!url || !platform) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: url and platform'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`Extracting recipe from ${platform} URL: ${url}`);
    let recipeData = null;
    if (platform === 'instagram') {
      recipeData = await extractInstagramRecipe(url);
    } else if (platform === 'tiktok') {
      recipeData = await extractTikTokRecipe(url);
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: `Unsupported platform: ${platform}`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!recipeData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to extract recipe data'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      recipe: recipeData,
      method: 'supabase_function',
      platform,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in extract-recipe-from-social:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
async function extractInstagramRecipe(url) {
  try {
    // Try Instagram oEmbed API first
    const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${Deno.env.get('FACEBOOK_APP_ID')}|${Deno.env.get('FACEBOOK_APP_SECRET')}`;
    const oembedResponse = await fetch(oembedUrl);
    if (oembedResponse.ok) {
      const oembedData = await oembedResponse.json();
      console.log('Instagram oEmbed data:', oembedData);
      const recipeData = {
        title: extractTitleFromCaption(oembedData.title || ''),
        description: oembedData.title || 'Instagram Recipe',
        url,
        platform: 'instagram',
        author: oembedData.author_name,
        thumbnailUrl: oembedData.thumbnail_url,
        caption: oembedData.title,
        ingredients: [],
        instructions: [],
        tags: [
          'instagram',
          'social-media'
        ]
      };
      // Try to extract recipe information using AI if available
      if (oembedData.title && Deno.env.get('GOOGLE_API_KEY')) {
        try {
          const aiRecipe = await extractRecipeWithAI(oembedData.title, 'instagram');
          if (aiRecipe) {
            recipeData.ingredients = aiRecipe.ingredients || [];
            recipeData.instructions = aiRecipe.instructions || [];
            recipeData.tags = [
              ...recipeData.tags || [],
              ...aiRecipe.tags || []
            ];
          }
        } catch (aiError) {
          console.log('AI extraction failed:', aiError);
        }
      }
      return recipeData;
    }
    // Fallback: create basic recipe from URL
    console.log('Instagram oEmbed failed, creating fallback recipe');
    return createFallbackRecipe(url, 'instagram');
  } catch (error) {
    console.error('Instagram extraction error:', error);
    return createFallbackRecipe(url, 'instagram');
  }
}
async function extractTikTokRecipe(url) {
  try {
    // Try Firecrawl scraping if available
    if (Deno.env.get('FIRECRAWL_API_KEY')) {
      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('FIRECRAWL_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          formats: [
            'markdown'
          ],
          onlyMainContent: true
        })
      });
      if (firecrawlResponse.ok) {
        const firecrawlData = await firecrawlResponse.json();
        console.log('TikTok Firecrawl data:', firecrawlData);
        if (firecrawlData.data?.content) {
          const content = firecrawlData.data.content;
          const recipeData = {
            title: extractTitleFromContent(content) || 'TikTok Recipe',
            description: content.substring(0, 500) + '...',
            url,
            platform: 'tiktok',
            ingredients: [],
            instructions: [],
            tags: [
              'tiktok',
              'video'
            ]
          };
          // Try AI extraction if available
          if (Deno.env.get('GOOGLE_API_KEY')) {
            try {
              const aiRecipe = await extractRecipeWithAI(content, 'tiktok');
              if (aiRecipe) {
                recipeData.ingredients = aiRecipe.ingredients || [];
                recipeData.instructions = aiRecipe.instructions || [];
                recipeData.tags = [
                  ...recipeData.tags || [],
                  ...aiRecipe.tags || []
                ];
              }
            } catch (aiError) {
              console.log('AI extraction failed:', aiError);
            }
          }
          return recipeData;
        }
      }
    }
    // Fallback: create basic recipe from URL
    console.log('TikTok scraping failed, creating fallback recipe');
    return createFallbackRecipe(url, 'tiktok');
  } catch (error) {
    console.error('TikTok extraction error:', error);
    return createFallbackRecipe(url, 'tiktok');
  }
}
async function extractRecipeWithAI(content, platform) {
  try {
    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) return null;
    const prompt = `Extract recipe information from this ${platform} content. Return JSON with: title, description, ingredients (array of strings), instructions (array of strings), servings (number), prepTime (minutes), cookTime (minutes), tags (array of strings). If no recipe is found, return null.

Content: ${content.substring(0, 2000)}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) return null;
    // Try to parse JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI extraction error:', error);
    return null;
  }
}
function extractTitleFromCaption(caption) {
  if (!caption) return 'Social Media Recipe';
  const lines = caption.split('\n');
  const firstLine = lines[0]?.trim();
  if (firstLine && firstLine.length < 100) {
    return firstLine;
  }
  const sentences = caption.split(/[.!?]/);
  const firstSentence = sentences[0]?.trim();
  if (firstSentence && firstSentence.length < 100) {
    return firstSentence;
  }
  return 'Social Media Recipe';
}
function extractTitleFromContent(content) {
  // Try to find a title-like pattern in the content
  const lines = content.split('\n');
  for (const line of lines){
    const trimmed = line.trim();
    if (trimmed.length > 10 && trimmed.length < 100 && !trimmed.startsWith('#')) {
      return trimmed;
    }
  }
  return 'TikTok Recipe';
}
function createFallbackRecipe(url, platform) {
  const platformNames = {
    instagram: 'Instagram',
    tiktok: 'TikTok'
  };
  return {
    title: `Recipe from ${platformNames[platform]}`,
    description: `Recipe from ${platformNames[platform]}. Limited information available. Please add ingredients and instructions manually.`,
    url,
    platform,
    ingredients: [],
    instructions: [
      'Please add cooking instructions manually'
    ],
    tags: [
      platform,
      'fallback'
    ],
    author: 'Social Media Creator'
  };
}
