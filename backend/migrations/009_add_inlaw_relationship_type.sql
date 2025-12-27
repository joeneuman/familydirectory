-- Add 'in-law' as a relationship type option for mother and father
-- This allows tracking mother-in-law and father-in-law relationships

-- Drop existing check constraints (PostgreSQL auto-generates constraint names)
-- We'll find and drop them by searching for constraints on these columns
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- Find and drop mother_relationship_type constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'persons'::regclass
      AND conname LIKE '%mother_relationship_type%'
      AND contype = 'c';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE persons DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
    
    -- Find and drop father_relationship_type constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'persons'::regclass
      AND conname LIKE '%father_relationship_type%'
      AND contype = 'c';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE persons DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END $$;

-- Add new check constraints that include 'in-law'
ALTER TABLE persons 
ADD CONSTRAINT persons_mother_relationship_type_check 
CHECK (mother_relationship_type IN ('biological', 'step', 'in-law'));

ALTER TABLE persons 
ADD CONSTRAINT persons_father_relationship_type_check 
CHECK (father_relationship_type IN ('biological', 'step', 'in-law'));

