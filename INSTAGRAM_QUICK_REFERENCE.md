# Instagram Scraping Quick Reference

## 🚀 Quick Start

### Environment Setup
```env
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
APIFY_API_TOKEN=your_apify_api_token
APIFY_ACTOR_ID_INSTAGRAM=apify~instagram-scraper
```

### Test Instagram URL
```
https://www.instagram.com/p/DNjhM8nynzj/
```

## 📱 API Endpoints

### 1. Instagram OAuth
```bash
GET /api/auth/instagram?userId=user_uuid
```

### 2. Scrape Instagram Post
```bash
POST /api/scrape
{
  "url": "https://www.instagram.com/p/DNjhM8nynzj/",
  "platform": "instagram",
  "userId": "user_uuid"
}
```

### 3. Instagram API Scrape
```bash
POST /api/instagram/scrape
{
  "url": "https://www.instagram.com/p/DNjhM8nynzj/",
  "userId": "user_uuid"
}
```

## 🎯 Expected Response

### Successful Scraping
```json
{
  "success": true,
  "jobId": "ffd21c4e-79fb-4a32-96ea-9683b5d75f2d",
  "message": "Scraping job started successfully."
}
```

### Recipe Data (Expected)
```json
{
  "title": "🥤 Chia Pudding Recipe",
  "ingredients": [
    "Chia seeds",
    "Milk or plant-based milk", 
    "Sweetener (honey, maple syrup, etc.)",
    "Vanilla extract",
    "Toppings (berries, nuts, etc.)"
  ],
  "instructions": [
    "Mix chia seeds with liquid",
    "Add sweetener and vanilla",
    "Stir well to combine", 
    "Refrigerate overnight",
    "Serve with desired toppings"
  ],
  "image": "https://scontent.cdninstagram.com/v/...",
  "url": "https://www.instagram.com/p/DNjhM8nynzj/",
  "platform": "instagram"
}
```

## 🔧 System Flow

1. **Primary**: Instagram Basic Display API (official)
2. **Fallback**: Apify scraping with Facebook credentials
3. **Extraction**: Automatic recipe parsing from captions
4. **Storage**: Save to Supabase database

## ✅ Test Status

- **Instagram scraping endpoint**: ✅ Working
- **Facebook API credentials**: ✅ Configured
- **Database tables**: ✅ Created
- **Recipe extraction**: ✅ Functional
- **User authentication**: ✅ Ready

## 🚨 Common Issues

### "FACEBOOK_APP_ID is not configured"
→ Add Facebook credentials to environment variables

### "Instagram account not connected"
→ User needs to authenticate with Instagram first

### "User not found"
→ Ensure user exists in Supabase auth.users table

### "Empty or private data"
→ Instagram post may be private or blocked

## 📊 Files Created

- `src/lib/instagram-api.ts` - Instagram API integration
- `src/app/api/auth/instagram/route.ts` - OAuth authentication
- `src/app/api/instagram/scrape/route.ts` - Instagram scraping
- `instagram-database-schema.sql` - Database tables
- `INSTAGRAM_SCRAPING_DOCUMENTATION.md` - Full documentation

## 🎉 Production Ready

The Instagram scraping system is fully functional and ready for production use with:
- Official Facebook/Instagram API integration
- Robust fallback scraping
- Automatic recipe extraction
- Secure user authentication
- Database persistence
