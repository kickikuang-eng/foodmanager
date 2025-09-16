# Facebook API + Instagram Integration Setup

## Your Facebook API Credentials
✅ **App ID**: `your_facebook_app_id`  
✅ **App Secret**: `your_facebook_app_secret`

## Integration Options

### Option 1: Instagram Basic Display API (Recommended)
- **Pros**: Official API, reliable, respects rate limits
- **Cons**: Requires user authentication, limited to user's own posts
- **Best for**: When users want to import their own Instagram recipe posts

### Option 2: Instagram Graph API
- **Pros**: Access to business accounts, more data
- **Cons**: Requires business Instagram account
- **Best for**: Business accounts and pages

### Option 3: Enhanced Apify Scraping with Facebook Credentials
- **Pros**: Can access public posts, works with existing Apify setup
- **Cons**: Still subject to Instagram's anti-scraping measures
- **Best for**: Public posts when API doesn't work

## Environment Configuration

Add to your `.env.local`:

```env
# Facebook/Instagram API Configuration
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Instagram Basic Display API
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback

# Apify Configuration (with Facebook credentials)
APIFY_API_TOKEN=your_apify_api_token
APIFY_ACTOR_ID_INSTAGRAM=apify~instagram-scraper
```

## Required Facebook App Permissions

In your Facebook Developer Console, ensure your app has:

1. **Instagram Basic Display**:
   - `instagram_basic`
   - `instagram_content_publish` (if needed)

2. **Instagram Graph API** (for business accounts):
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_insights`

## Implementation Steps

1. **Update Environment Variables**
2. **Implement Instagram Basic Display API Integration**
3. **Update Apify Configuration with Facebook Credentials**
4. **Add Instagram OAuth Flow**
5. **Update Recipe Scraping Logic**

## Next Steps

1. Configure Facebook app permissions in Facebook Developer Console
2. Set up Instagram Basic Display API
3. Implement OAuth flow for user authentication
4. Update scraping logic to use Instagram API as primary method
5. Fallback to enhanced Apify scraping for public posts
