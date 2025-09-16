# Simplified Scraping Structure

## Overview

The scraping functionality has been simplified into a single, easy-to-use module that consolidates all the complex logic while maintaining the same functionality.

## Files

### Core Files
- `src/lib/scraping.ts` - Main scraping module (replaces the entire complex directory structure)
- `src/app/api/scrape-v2/route.ts` - Enhanced API endpoint

### Existing Files (kept)
- `src/lib/youtube.ts` - YouTube utilities (used by scraping module)
- `src/lib/instagram-api.ts` - Instagram API utilities
- `src/lib/instagram-apify.ts` - Instagram Apify integration
- `src/lib/apify.ts` - General Apify utilities

## Usage

### Simple Usage
```typescript
import { scrapeRecipe } from '@/lib/scraping'

const result = await scrapeRecipe('https://www.youtube.com/watch?v=...')
if (result.success) {
  console.log('Recipe:', result.recipe)
  console.log('Confidence:', result.confidence)
} else {
  console.error('Failed:', result.error)
}
```

### With User Authentication
```typescript
const result = await scrapeRecipe(url, userId)
```

### Test URL
```typescript
import { testUrlScraping } from '@/lib/scraping'

const test = await testUrlScraping('https://instagram.com/p/...')
if (test.success) {
  console.log(`Platform: ${test.platform}`)
}
```

## API Endpoint

### POST /api/scrape-v2

**Request:**
```json
{
  "url": "https://instagram.com/p/...",
  "userId": "user-id" // optional
}
```

**Response:**
```json
{
  "success": true,
  "recipeId": "recipe-id",
  "method": "supabase_function",
  "confidence": 0.7,
  "warnings": [],
  "message": "Recipe extracted successfully using supabase_function method."
}
```

## How It Works

1. **Platform Detection**: Automatically detects YouTube, Instagram, or TikTok
2. **Smart Routing**: Routes to the best available method for each platform
3. **Fallback Logic**: If primary method fails, tries alternatives
4. **Consistent Response**: All platforms return the same data structure

### Platform Support

- **YouTube**: Direct API + AI analysis (supports guest mode)
- **Instagram**: Supabase Function → Apify (with fallbacks)
- **TikTok**: Supabase Function → Basic fallback (handles anti-scraping)

## Benefits

✅ **Simple**: Single file with clear, readable code  
✅ **Reliable**: Automatic fallbacks when methods fail  
✅ **Maintainable**: Easy to understand and modify  
✅ **Compatible**: Works with existing Instagram/TikTok improvements  
✅ **Type Safe**: Full TypeScript support  

## Migration

Replace any calls to the old complex scraping system:

```typescript
// Old (complex)
import { scrapingOrchestrator } from '@/lib/scraping/orchestrator'

// New (simple)
import { scrapeRecipe } from '@/lib/scraping'
```

That's it! The new structure is much simpler while maintaining all the functionality.
