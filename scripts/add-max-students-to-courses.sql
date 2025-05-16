-- Add max_students column to courses table
ALTER TABLE courses 
ADD COLUMN max_students INTEGER DEFAULT 30;

-- Add comment to the column
COMMENT ON COLUMN courses.max_students IS 'Maximum number of students allowed in the course';
