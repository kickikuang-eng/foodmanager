// src/lib/instagram-api.ts

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

  // Detect platform and use appropriate actor
  let actorId: string;
  let payload: any;
  
  if (url.includes('instagram.com')) {
    actorId = process.env.APIFY_ACTOR_ID_INSTAGRAM || "apify~instagram-scraper";
    const isPresetReelActor = /presetshubham/i.test(actorId);
    payload = isPresetReelActor
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
  } else if (url.includes('tiktok.com')) {
    actorId = process.env.APIFY_ACTOR_ID_TIKTOK || "clockworks/tiktok-scraper";
    payload = {
      videoUrls: [url],
      resultsPerPage: 1,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSlideshowImages: false
    };
  } else {
    throw new Error(`Unsupported platform for URL: ${url}`);
  }

  const actorSlug = encodeURIComponent(actorId);

  console.log('Apify payload:', JSON.stringify(payload, null, 2));
  console.log('Actor ID:', actorId);

  // Start the actor run
  const actorRunResponse = await fetch(
    `https://api.apify.com/v2/acts/${actorSlug}/runs?token=${apiToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!actorRunResponse.ok) {
    const errorText = await actorRunResponse.text();
    throw new Error(`Apify actor start failed: ${actorRunResponse.status} ${errorText}`);
  }

  const runData = await actorRunResponse.json();
  const runId = runData.data.id;
  console.log('Apify run started with ID:', runId);

  // Wait for the run to complete (with timeout)
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds timeout

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
      headers: { "Authorization": `Bearer ${apiToken}` }
    });
    if (!statusResponse.ok) throw new Error(`Failed to check run status: ${statusResponse.status}`);
    const statusData = await statusResponse.json();
    const status = statusData.data.status;
    console.log(`Apify run status (attempt ${attempts + 1}):`, status);
    
    if (status === "SUCCEEDED") {
      // Get the results
      const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items`, {
        headers: { "Authorization": `Bearer ${apiToken}` }
      });
      if (!resultsResponse.ok) throw new Error(`Failed to get results: ${resultsResponse.status}`);
      const results = await resultsResponse.json();
      console.log('Apify results:', JSON.stringify(results, null, 2));
      
      if (results && results.length > 0) {
        const result = results[0];
        console.log('Processing Apify result:', result);
        
        const extractedData = {
          caption: result.caption || result.description || null,
          author: result.owner_username || result.owner || result.username || null,
          thumbnailUrl: result.thumbnail || result.cover || result.video_url || null
        };
        
        // Cache the successful result
        cache.set(cacheKey, { data: extractedData, timestamp: Date.now() });
        console.log('Cached result for:', url);
        
        return extractedData;
      }
      console.log('No results from Apify - likely rate limited');
      
      // If we have cached data, return it even if it's old
      const oldCached = cache.get(cacheKey);
      if (oldCached) {
        console.log('Returning old cached result due to rate limiting');
        return oldCached.data;
      }
      
      return {};
    } else if (status === "FAILED") {
      throw new Error("Apify run failed");
    }
    attempts++;
  }
  throw new Error("Apify run timeout");
}