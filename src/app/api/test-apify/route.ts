import { NextResponse } from "next/server";

export async function GET() {
  const apifyToken = process.env.APIFY_API_TOKEN;
  const apifyActorId = process.env.APIFY_ACTOR_ID;
  const apifyActorIdYoutube = process.env.APIFY_ACTOR_ID_YOUTUBE;
  const apifyActorIdInstagram = process.env.APIFY_ACTOR_ID_INSTAGRAM;
  const apifyActorIdTiktok = process.env.APIFY_ACTOR_ID_TIKTOK;
  const apifyActorIdDefault = process.env.APIFY_ACTOR_ID_DEFAULT;
  
  // Get all environment variables that start with APIFY
  const apifyEnvVars = Object.keys(process.env)
    .filter(key => key.startsWith('APIFY'))
    .reduce((obj, key) => {
      obj[key] = process.env[key] ? `${process.env[key]?.substring(0, 8)}...` : 'Not set';
      return obj;
    }, {} as Record<string, string>);
  
  return NextResponse.json({
    hasToken: !!apifyToken,
    tokenLength: apifyToken?.length || 0,
    tokenPreview: apifyToken ? `${apifyToken.substring(0, 8)}...` : 'Not set',
    
    // Actor configuration
    actors: {
      main: {
        configured: !!apifyActorId,
        preview: apifyActorId ? `${apifyActorId.substring(0, 8)}...` : 'Not set'
      },
      youtube: {
        configured: !!apifyActorIdYoutube,
        preview: apifyActorIdYoutube ? `${apifyActorIdYoutube.substring(0, 8)}...` : 'Not set'
      },
      instagram: {
        configured: !!apifyActorIdInstagram,
        preview: apifyActorIdInstagram ? `${apifyActorIdInstagram.substring(0, 8)}...` : 'Not set'
      },
      tiktok: {
        configured: !!apifyActorIdTiktok,
        preview: apifyActorIdTiktok ? `${apifyActorIdTiktok.substring(0, 8)}...` : 'Not set'
      },
      default: {
        configured: !!apifyActorIdDefault,
        preview: apifyActorIdDefault ? `${apifyActorIdDefault.substring(0, 8)}...` : 'Not set'
      }
    },
    
    allApifyVars: apifyEnvVars,
    nodeEnv: process.env.NODE_ENV,
    
    // Summary
    summary: {
      hasAnyActor: !!(apifyActorId || apifyActorIdYoutube || apifyActorIdInstagram || apifyActorIdTiktok || apifyActorIdDefault),
      configuredActors: [
        apifyActorId && 'main',
        apifyActorIdYoutube && 'youtube',
        apifyActorIdInstagram && 'instagram', 
        apifyActorIdTiktok && 'tiktok',
        apifyActorIdDefault && 'default'
      ].filter(Boolean)
    }
  });
}
