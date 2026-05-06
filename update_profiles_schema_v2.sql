-- Update profiles table schema for new fields
-- Run these commands in Supabase SQL Editor

-- Add new columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date date;

-- Rename birth_year to birth_date if exists (but since we're adding birth_date, assume it's new)
-- If birth_year exists, you might need to migrate data first, but assuming fresh schema

-- Ensure avatar_url exists (as mentioned it's added)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Ensure positions is text[] (array)
-- If it's not, you might need to alter it, but assuming it's already text[]

-- Note: Run this after confirming the bucket 'avatars' is created in Supabase Storage