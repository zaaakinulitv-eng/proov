-- Create scout_contacts table for player contact functionality
-- Run this in Supabase SQL Editor

CREATE TABLE scout_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scout_name TEXT NOT NULL,
  scout_email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Add index for performance
  CONSTRAINT scout_contacts_player_id_idx ON scout_contacts(player_id)
);

-- Enable Row Level Security
ALTER TABLE scout_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view all contacts
CREATE POLICY "Admins can view all contacts" ON scout_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'erikagi@yandex.ru'
    )
  );

-- Policy: Players can view contacts sent to them
CREATE POLICY "Players can view their own contacts" ON scout_contacts
  FOR SELECT USING (
    player_id = auth.uid()
  );

-- Policy: Anyone can insert contacts (public contact form)
CREATE POLICY "Anyone can send contacts" ON scout_contacts
  FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT ON scout_contacts TO authenticated;
GRANT SELECT ON scout_contacts TO anon;