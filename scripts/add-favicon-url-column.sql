-- Add favicon_url column to institutions table if it doesn't exist
ALTER TABLE institutions 
ADD COLUMN IF NOT EXISTS favicon_url TEXT;
