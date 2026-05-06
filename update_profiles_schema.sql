-- Supabase migration for profile schema updates
-- Run this in Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_year int;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height int;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS strong_foot text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS positions text[];

-- Set default empty array for existing profiles if needed
UPDATE profiles SET positions = '{}' WHERE positions IS NULL;