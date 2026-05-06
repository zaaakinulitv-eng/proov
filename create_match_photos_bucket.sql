-- Create storage bucket for match photos
-- Run this in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('match-photos', 'match-photos', true);

-- Set up RLS policies for the bucket
CREATE POLICY "Anyone can view match photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'match-photos');

CREATE POLICY "Authenticated users can upload match photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'match-photos'
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own photos
CREATE POLICY "Users can update their own match photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'match-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own match photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'match-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );