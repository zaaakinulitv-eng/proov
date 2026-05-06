-- Create a public Supabase Storage bucket for avatars
-- Run this in Supabase SQL Editor or Storage UI

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- This bucket should be public so avatars can be displayed directly in the app.
-- If you manage access differently, ensure public URLs are available for uploaded files.

-- Example RLS policies are usually managed via Storage UI.
-- For a simple public bucket, no further policies may be required.