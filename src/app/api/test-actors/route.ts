import { NextResponse } from "next/server";

export async function GET() {
  const apifyToken = process.env.APIFY_API_TOKEN;
  const actors = {
    youtube: process.env.APIFY_ACTOR_ID_YOUTUBE,
    instagram: process.env.APIFY_ACTOR_ID_INSTAGRAM,
    tiktok: process.env.APIFY_ACTOR_ID_TIKTOK,
    default: process.env.APIFY_ACTOR_ID_DEFAULT
  };

  const results: Record<string, any> = {};

  for (const [platform, actorId] of Object.entries(actors)) {
    if (!actorId) {
      results[platform] = { status: 'not_configured' };
      continue;
    }

    try {
      // Test if the actor exists by trying to get its info
      const response = await fetch(
        `https://api.apify.com/v2/acts/${actorId}?token=${apifyToken}`,
        { method: 'GET' }
      );

      if (response.ok) {
        const data = await response.json();
        results[platform] = {
          status: 'exists',
          name: data.data?.name || 'Unknown',
          username: data.data?.username || 'Unknown',
          isPublic: data.data?.isPublic || false
        };
      } else {
        results[platform] = {
          status: 'error',
          error: response.statusText,
          statusCode: response.status
        };
      }
    } catch (error) {
      results[platform] = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  return NextResponse.json({
    summary: {
      totalActors: Object.keys(actors).length,
      workingActors: Object.values(results).filter(r => r.status === 'exists').length,
      errorActors: Object.values(results).filter(r => r.status === 'error').length
    },
    results
  });
}
