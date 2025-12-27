-- Add mother_id and father_id fields to persons table
-- These are required for everyone except G1 (generation 1)
ALTER TABLE persons 
ADD COLUMN IF NOT EXISTS mother_id UUID REFERENCES persons(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS father_id UUID REFERENCES persons(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_persons_mother ON persons(mother_id);
CREATE INDEX IF NOT EXISTS idx_persons_father ON persons(father_id);

