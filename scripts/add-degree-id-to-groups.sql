-- Add degree_id column to groups table with the correct UUID type
ALTER TABLE groups ADD COLUMN IF NOT EXISTS degree_id UUID REFERENCES degrees(id);

-- Update existing groups to set degree_id based on program's degree_id
UPDATE groups g
SET degree_id = p.degree_id
FROM programs p
WHERE g.program_id = p.id AND g.degree_id IS NULL;

-- Add a comment to explain the column
COMMENT ON COLUMN groups.degree_id IS 'Reference to the degree this group belongs to';
