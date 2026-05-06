-- Add verification_type column to matches table if it doesn't exist
ALTER TABLE matches 
ADD COLUMN verification_type VARCHAR(50) DEFAULT 'photo';

-- Add comment explaining the field
COMMENT ON COLUMN matches.verification_type IS 'Type of verification: photo (AI-verified) or self_reported (auto_pending)';
