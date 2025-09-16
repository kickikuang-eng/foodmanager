import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { videoUrl, userId } = await req.json()

    if (!videoUrl || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing videoUrl or userId'
      }, { status: 400 })
    }

    console.log('Processing video URL with Gemini:', videoUrl)

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'GOOGLE_AI_API_KEY is not set'
      }, { status: 500 })
    }

    const info = extractVideoInfo(videoUrl)
    const thumbnailUrl = getVideoThumbnail(info)
    const thumbBase64 = thumbnailUrl ? await fetchImageAsBase64(thumbnailUrl) : null

    const ai = await analyzeWithGemini({
      videoUrl,
      thumbnailBase64: thumbBase64
    })

    let text = ""
    try {
      text = ai.candidates?.[0]?.content?.parts?.[0]?.text || ""
    } catch (e) {
      console.error('Error extracting text from Gemini response:', e)
    }

    let parsed = parseJsonFromText(text)
    if (!parsed) {
      parsed = {
        title: "AI Extracted Recipe",
        description: "A recipe extracted from the provided video.",
        ingredients: ["1 tbsp oil", "Salt to taste"],
        instructions: ["Prepare ingredients", "Cook and serve"],
        prep_time_minutes: null,
        cook_time_minutes: null,
        servings: null,
        cuisine: null,
        difficulty: null
      }
    }

    const recipe = normalizeRecipe(parsed)

    // Derive chef/author from URL where possible
    const derivedChef = extractAuthorFromUrl(videoUrl) || (info.platform === 'youtube' ? await fetchYouTubeAuthor(videoUrl) : null)

    // Save to Supabase if available
    let savedRecipe = null
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        const insertPayload = {
          user_id: userId,
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          image_url: thumbnailUrl || null,
          source_url: videoUrl,
          prep_time: recipe.prep_time_minutes,
          cook_time: recipe.cook_time_minutes,
          servings: recipe.servings,
          cuisine: recipe.cuisine,
          difficulty: recipe.difficulty,
          chef: derivedChef || null
        }

        const { data: inserted, error: dbError } = await supabase.from("recipes").insert(insertPayload).select().single()

        if (dbError) {
          console.error("DB insert error:", dbError)
        } else {
          savedRecipe = inserted
          console.log("Recipe saved successfully:", inserted)
        }
      } catch (dbError) {
        console.error("Database error:", dbError)
      }
    }

    return NextResponse.json({
      success: true,
      recipe: savedRecipe || recipe
    })

  } catch (error) {
    console.error("extract-recipe-with-gemini error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

function extractVideoInfo(url: string) {
  try {
    const u = new URL(url)
    
    // YouTube
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v")
      return { platform: "youtube", id }
    }
    
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.split("/")[1] || null
      return { platform: "youtube", id }
    }
    
    // TikTok
    if (u.hostname.includes("tiktok.com")) {
      const m = u.pathname.match(/video\/(\d+)/)
      return { platform: "tiktok", id: m?.[1] || null }
    }
    
    // Instagram
    if (u.hostname.includes("instagram.com")) {
      const seg = u.pathname.split("/").filter(Boolean)
      const id = seg[1] || null
      return { platform: "instagram", id }
    }
  } catch (e) {
    console.error("Error parsing URL:", e)
  }
  
  return { platform: "unknown", id: null }
}

function getVideoThumbnail(info: any) {
  if (info.platform === "youtube" && info.id) {
    return `https://img.youtube.com/vi/${info.id}/hqdefault.jpg`
  }
  return null
}

async function fetchImageAsBase64(url: string) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    
    const contentType = res.headers.get("content-type") || "image/jpeg"
    const ab = await res.arrayBuffer()
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(ab))))
    
    return { base64, mime: contentType }
  } catch (e) {
    console.warn("Failed to fetch thumbnail:", e)
    return null
  }
}

function buildPrompt(videoUrl: string) {
  return `You are a culinary assistant. Analyze the provided content (image snapshot if present and the described video URL) to extract a well-structured cooking recipe.

Return STRICT JSON only with these fields:
{
  "title": string,
  "description": string,
  "ingredients": string[],
  "instructions": string[],
  "prep_time_minutes": number | null,
  "cook_time_minutes": number | null,
  "servings": number | null,
  "cuisine": string | null,
  "difficulty": "easy" | "medium" | "hard" | null
}

Guidelines:
- If details are unclear, infer reasonable defaults.
- Ingredients: concise items with amounts when visible.
- Instructions: numbered, imperative steps.
- Keep it simple and realistic.

Video URL context: ${videoUrl}`
}

async function analyzeWithGemini(params: {videoUrl: string, thumbnailBase64?: any}) {
  const model = "gemini-1.5-flash"
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`
  
  const parts: any[] = [{ text: buildPrompt(params.videoUrl) }]
  
  if (params.thumbnailBase64) {
    parts.push({
      inline_data: {
        mime_type: params.thumbnailBase64.mime,
        data: params.thumbnailBase64.base64
      }
    })
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024
    }
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Gemini API error: ${res.status} ${t}`)
  }

  return await res.json()
}

function parseJsonFromText(text: string) {
  try {
    return JSON.parse(text)
  } catch (_) {
    const match = text.match(/\{[\s\S]*\}$/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch (_) {
        return null
      }
    }
    return null
  }
}

function normalizeRecipe(raw: any) {
  return {
    title: String(raw?.title || "Untitled Recipe"),
    description: String(raw?.description || ""),
    ingredients: Array.isArray(raw?.ingredients) ? raw.ingredients.map((i: any) => String(i)).slice(0, 50) : [],
    instructions: Array.isArray(raw?.instructions) ? raw.instructions.map((s: any) => String(s)).slice(0, 100) : [],
    prep_time_minutes: raw?.prep_time_minutes != null ? Number(raw.prep_time_minutes) : null,
    cook_time_minutes: raw?.cook_time_minutes != null ? Number(raw.cook_time_minutes) : null,
    servings: raw?.servings != null ? Number(raw.servings) : null,
    cuisine: raw?.cuisine != null ? String(raw.cuisine) : null,
    difficulty: raw?.difficulty != null ? String(raw.difficulty) : null
  }
}

function extractAuthorFromUrl(url: string) {
  try {
    const u = new URL(url)
    const host = u.hostname
    const path = u.pathname

    if (host.includes('tiktok.com')) {
      const m = path.match(/\/@[\w.-]+/)
      if (m) return m[0]
    }

    if (host.includes('instagram.com')) {
      const seg = path.split('/').filter(Boolean)
      if (seg.length > 0 && !['reel', 'p'].includes(seg[0])) return seg[0]
    }

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      const mHandle = path.match(/\/(@[^\/?#]+)/)
      if (mHandle) return mHandle[1]
      const mC = path.match(/\/c\/([^\/?#]+)/)
      if (mC) return mC[1]
    }

    return null
  } catch {
    return null
  }
}

async function fetchYouTubeAuthor(videoUrl: string) {
  try {
    const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
    const res = await fetch(oembed)
    if (!res.ok) return null
    const data = await res.json()
    return typeof data?.author_name === 'string' ? data.author_name : null
  } catch {
    return null
  }
}
