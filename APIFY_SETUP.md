run# Apify Setup Guide

## Option 1: Single Actor (Simplest)

Add this to your `.env.local` file:

```env
APIFY_API_TOKEN=your_apify_api_token
APIFY_ACTOR_ID=apify/web-scraper
```

## Option 2: Platform-Specific Actors (Recommended)

Add this to your `.env.local` file:

```env
APIFY_API_TOKEN=your_apify_api_token

# Platform-specific actors
APIFY_ACTOR_ID_YOUTUBE=apify/youtube-scraper
APIFY_ACTOR_ID_INSTAGRAM=apify/instagram-scraper
APIFY_ACTOR_ID_TIKTOK=apify/tiktok-scraper

# Fallback actor
APIFY_ACTOR_ID_DEFAULT=apify/web-scraper
```

## Option 3: Custom Recipe Scrapers

If you want to use specialized recipe scrapers:

```env
APIFY_API_TOKEN=your_apify_api_token

# Recipe-specific actors
APIFY_ACTOR_ID_YOUTUBE=apify/youtube-scraper
APIFY_ACTOR_ID_INSTAGRAM=apify/instagram-scraper
APIFY_ACTOR_ID_TIKTOK=apify/tiktok-scraper

# General purpose fallback
APIFY_ACTOR_ID_DEFAULT=apify/cheerio-scraper
```

## Popular Apify Actors for Recipe Scraping

### General Purpose
- `apify/web-scraper` - General web scraping
- `apify/cheerio-scraper` - Flexible HTML scraping
- `apify/puppeteer-scraper` - JavaScript-heavy sites

### Platform Specific
- `apify/youtube-scraper` - YouTube videos and metadata
- `apify/instagram-scraper` - Instagram posts and stories
- `apify/tiktok-scraper` - TikTok videos and metadata

### Recipe Specific
- `apify/recipe-scraper` - Specialized recipe extraction
- `apify/food-blog-scraper` - Food blog content

## Testing Your Configuration

1. Update your `.env.local` file with the actors you want to use
2. Restart your development server: `npm run dev`
3. Visit: `http://localhost:3000/api/test-apify`
4. Check that your actors are configured correctly

## How It Works

The system will automatically:
1. **Detect the platform** from the URL (YouTube, Instagram, TikTok)
2. **Choose the appropriate actor** for that platform
3. **Fall back to default actor** if platform-specific actor isn't configured
4. **Start the scraping job** with the selected actor

## Troubleshooting

- Make sure your `.env.local` file is in the project root
- Restart your development server after making changes
- Check the test endpoint to verify configuration
- Ensure your Apify API token has access to the actors you're using
