-- Instagram Authentication Tables
-- Add these to your Supabase database

-- Instagram authentication states (for OAuth flow)
CREATE TABLE IF NOT EXISTS instagram_auth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    state TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instagram authentication credentials
CREATE TABLE IF NOT EXISTS instagram_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instagram_user_id TEXT NOT NULL,
    instagram_username TEXT NOT NULL,
    access_token TEXT NOT NULL,
    account_type TEXT CHECK (account_type IN ('PERSONAL', 'BUSINESS')),
    media_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(instagram_user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_instagram_auth_user_id ON instagram_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_auth_states_user_id ON instagram_auth_states(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_auth_states_created_at ON instagram_auth_states(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE instagram_auth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_auth ENABLE ROW LEVEL SECURITY;

-- Users can only access their own Instagram auth data
CREATE POLICY "Users can access their own instagram auth states" ON instagram_auth_states
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own instagram auth" ON instagram_auth
    FOR ALL USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_instagram_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_instagram_auth_updated_at
    BEFORE UPDATE ON instagram_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_instagram_auth_updated_at();

-- Clean up old auth states (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_instagram_auth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM instagram_auth_states 
    WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON instagram_auth TO authenticated;
GRANT ALL ON instagram_auth_states TO authenticated;
