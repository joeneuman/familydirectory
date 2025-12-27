-- Add relationship type fields for mother and father
-- This allows tracking whether a parent is biological or a stepparent
ALTER TABLE persons 
ADD COLUMN IF NOT EXISTS mother_relationship_type VARCHAR(20) DEFAULT 'biological' CHECK (mother_relationship_type IN ('biological', 'step')),
ADD COLUMN IF NOT EXISTS father_relationship_type VARCHAR(20) DEFAULT 'biological' CHECK (father_relationship_type IN ('biological', 'step'));

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_persons_mother_relationship ON persons(mother_id, mother_relationship_type);
CREATE INDEX IF NOT EXISTS idx_persons_father_relationship ON persons(father_id, father_relationship_type);

