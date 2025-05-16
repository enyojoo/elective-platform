-- Add max_students column to universities table with default value of 5
ALTER TABLE universities 
ADD COLUMN max_students INTEGER NOT NULL DEFAULT 5;

-- Add comment to the column
COMMENT ON COLUMN universities.max_students IS 'Maximum number of students allowed for exchange programs with this university';
