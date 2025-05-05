-- Add favicon_url column to institutions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'institutions'
        AND column_name = 'favicon_url'
    ) THEN
        ALTER TABLE public.institutions
        ADD COLUMN favicon_url TEXT;
        RAISE NOTICE 'Added favicon_url column to institutions table';
    ELSE
        RAISE NOTICE 'favicon_url column already exists in institutions table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'institutions' 
AND column_name = 'favicon_url';
