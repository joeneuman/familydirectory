-- Add 'in-law' as a relationship type option for mother and father
-- This allows tracking mother-in-law and father-in-law relationships

-- Drop existing check constraints
ALTER TABLE persons DROP CONSTRAINT IF EXISTS persons_mother_relationship_type_check;
ALTER TABLE persons DROP CONSTRAINT IF EXISTS persons_father_relationship_type_check;

-- Add new check constraints that include 'in-law'
ALTER TABLE persons 
ADD CONSTRAINT persons_mother_relationship_type_check 
CHECK (mother_relationship_type IN ('biological', 'step', 'in-law'));

ALTER TABLE persons 
ADD CONSTRAINT persons_father_relationship_type_check 
CHECK (father_relationship_type IN ('biological', 'step', 'in-law'));

