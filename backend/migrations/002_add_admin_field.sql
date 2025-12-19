-- Add is_admin field to persons table
ALTER TABLE persons ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_persons_is_admin ON persons(is_admin) WHERE is_admin = TRUE;



