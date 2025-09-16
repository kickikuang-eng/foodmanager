/**
 * Instagram Basic Display API Integration
 * Uses Facebook API credentials to access Instagram data
 */

export interface InstagramUser {
  id: string;
  username: string;
  account_type: 'PERSONAL' | 'BUSINESS';
  media_count: number;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  timestamp: string;
  thumbnail_url?: string;
  children?: {
    data: Array<{
      id: string;
      media_type: 'IMAGE' | 'VIDEO';
      media_url: string;
    }>;
  };
}

export interface InstagramAuthResponse {
  access_token: string;
  user_id: string;
}

export interface InstagramError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
  };
}

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/auth/instagram/callback';

export class InstagramAPIError extends Error {
  constructor(
    message: string,
    public code?: number,
    public type?: string
  ) {
    super(message);
    this.name = 'InstagramAPIError';
  }
}

/**
 * Generate Instagram OAuth URL for user authentication
 */
export function getInstagramAuthUrl(): string {
  if (!FACEBOOK_APP_ID) {
    throw new InstagramAPIError('FACEBOOK_APP_ID is not configured');
  }

  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: INSTAGRAM_REDIRECT_URI,
    scope: 'user_profile,user_media',
    response_type: 'code',
    state: 'foodmanager_instagram_auth'
  });

  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<InstagramAuthResponse> {
  if (!FACEBOOK_APP_SECRET) {
    throw new InstagramAPIError('FACEBOOK_APP_SECRET is not configured');
  }

  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID!,
    client_secret: FACEBOOK_APP_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: INSTAGRAM_REDIRECT_URI,
    code
  });

  try {
    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error: InstagramError = await response.json();
      throw new InstagramAPIError(
        error.error.message,
        error.error.code,
        error.error.type
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof InstagramAPIError) {
      throw error;
    }
    throw new InstagramAPIError(`Failed to exchange code for token: ${error}`);
  }
}

/**
 * Get Instagram user profile
 */
export async function getInstagramUser(accessToken: string): Promise<InstagramUser> {
  try {
    const response = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error: InstagramError = await response.json();
      throw new InstagramAPIError(
        error.error.message,
        error.error.code,
        error.error.type
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof InstagramAPIError) {
      throw error;
    }
    throw new InstagramAPIError(`Failed to get Instagram user: ${error}`);
  }
}

/**
 * Get Instagram user's media (posts)
 */
export async function getInstagramMedia(
  accessToken: string,
  limit: number = 25
): Promise<InstagramMedia[]> {
  try {
    const fields = [
      'id',
      'caption',
      'media_type',
      'media_url',
      'permalink',
      'timestamp',
      'thumbnail_url',
      'children{id,media_type,media_url}'
    ].join(',');

    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error: InstagramError = await response.json();
      throw new InstagramAPIError(
        error.error.message,
        error.error.code,
        error.error.type
      );
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    if (error instanceof InstagramAPIError) {
      throw error;
    }
    throw new InstagramAPIError(`Failed to get Instagram media: ${error}`);
  }
}

/**
 * Get specific Instagram media by ID
 */
export async function getInstagramMediaById(
  mediaId: string,
  accessToken: string
): Promise<InstagramMedia> {
  try {
    const fields = [
      'id',
      'caption',
      'media_type',
      'media_url',
      'permalink',
      'timestamp',
      'thumbnail_url',
      'children{id,media_type,media_url}'
    ].join(',');

    const response = await fetch(
      `https://graph.instagram.com/${mediaId}?fields=${fields}&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error: InstagramError = await response.json();
      throw new InstagramAPIError(
        error.error.message,
        error.error.code,
        error.error.type
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof InstagramAPIError) {
      throw error;
    }
    throw new InstagramAPIError(`Failed to get Instagram media: ${error}`);
  }
}

/**
 * Extract recipe data from Instagram post
 */
export function extractRecipeFromInstagramPost(post: InstagramMedia) {
  const caption = post.caption || '';
  
  // Basic recipe extraction logic
  const ingredients: string[] = [];
  const instructions: string[] = [];
  
  // Look for common recipe patterns in caption
  const lines = caption.split('\n').map(line => line.trim()).filter(line => line);
  
  let currentSection = '';
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Detect ingredients section
    if (lowerLine.includes('ingredients') || lowerLine.includes('ingredient')) {
      currentSection = 'ingredients';
      continue;
    }
    
    // Detect instructions section
    if (lowerLine.includes('instructions') || lowerLine.includes('directions') || lowerLine.includes('method')) {
      currentSection = 'instructions';
      continue;
    }
    
    // Detect recipe title
    if (lowerLine.includes('recipe') || lowerLine.includes('how to make')) {
      currentSection = 'title';
      continue;
    }
    
    // Add to appropriate section
    if (currentSection === 'ingredients' && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))) {
      ingredients.push(line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''));
    } else if (currentSection === 'instructions' && (line.match(/^\d+\./) || line.startsWith('-') || line.startsWith('•'))) {
      instructions.push(line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, ''));
    }
  }
  
  return {
    title: caption.split('\n')[0] || 'Instagram Recipe',
    description: caption,
    ingredients,
    instructions,
    image: post.media_url,
    thumbnail: post.thumbnail_url || post.media_url,
    url: post.permalink,
    platform: 'instagram',
    author: '', // Will be filled from user data
    timestamp: post.timestamp
  };
}

/**
 * Extract Instagram media ID from URL
 */
export function extractInstagramMediaId(url: string): string | null {
  const match = url.match(/\/p\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Check if URL is a valid Instagram post URL
 */
export function isValidInstagramUrl(url: string): boolean {
  return /^https:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?/.test(url);
}
