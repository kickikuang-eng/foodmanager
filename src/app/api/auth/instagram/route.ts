import { NextRequest, NextResponse } from 'next/server';
import { getInstagramAuthUrl, exchangeCodeForToken, getInstagramUser } from '@/lib/instagram-api';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/auth/instagram
 * Initiate Instagram OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }
    
    // Generate Instagram OAuth URL
    const authUrl = getInstagramAuthUrl();
    
    // Store state in database for verification
    const { error } = await supabaseAdmin
      .from('instagram_auth_states')
      .insert({
        user_id: userId,
        state: 'foodmanager_instagram_auth',
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error storing auth state:', error);
      return NextResponse.json({ error: 'Failed to initiate authentication' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      authUrl,
      message: 'Redirect user to this URL to authenticate with Instagram'
    });
    
  } catch (error) {
    console.error('Error initiating Instagram auth:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate Instagram authentication' 
    }, { status: 500 });
  }
}

/**
 * POST /api/auth/instagram
 * Handle Instagram OAuth callback
 */
export async function POST(request: NextRequest) {
  try {
    const { code, state, userId } = await request.json();
    
    if (!code || !state || !userId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: code, state, userId' 
      }, { status: 400 });
    }
    
    // Verify state
    if (state !== 'foodmanager_instagram_auth') {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }
    
    // Exchange code for access token
    const authResponse = await exchangeCodeForToken(code);
    
    // Get Instagram user info
    const instagramUser = await getInstagramUser(authResponse.access_token);
    
    // Store Instagram credentials in database
    const { data: instagramAuth, error: authError } = await supabaseAdmin
      .from('instagram_auth')
      .upsert({
        user_id: userId,
        instagram_user_id: authResponse.user_id,
        instagram_username: instagramUser.username,
        access_token: authResponse.access_token,
        account_type: instagramUser.account_type,
        media_count: instagramUser.media_count,
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (authError) {
      console.error('Error storing Instagram auth:', authError);
      return NextResponse.json({ 
        error: 'Failed to store Instagram credentials' 
      }, { status: 500 });
    }
    
    // Clean up auth state
    await supabaseAdmin
      .from('instagram_auth_states')
      .delete()
      .eq('user_id', userId)
      .eq('state', state);
    
    return NextResponse.json({
      success: true,
      instagramUser,
      message: 'Instagram account connected successfully'
    });
    
  } catch (error) {
    console.error('Error handling Instagram callback:', error);
    return NextResponse.json({ 
      error: 'Failed to complete Instagram authentication' 
    }, { status: 500 });
  }
}
