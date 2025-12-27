-- Add gender field to persons table
-- This is required to determine specific relationships (sister/brother, niece/nephew, etc.)
ALTER TABLE persons 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('Male', 'Female'));

-- Make gender required (set a default for existing records, but new records must have it)
-- For existing records, we'll allow NULL temporarily, but the application should require it
-- You may want to update existing records manually before making it NOT NULL

