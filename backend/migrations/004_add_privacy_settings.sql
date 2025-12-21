-- Add privacy_settings column to persons table
-- This stores which fields a person wants to hide from others
ALTER TABLE persons ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{}'::jsonb;

-- Create index for privacy settings queries
CREATE INDEX IF NOT EXISTS idx_persons_privacy_settings ON persons USING GIN (privacy_settings);



