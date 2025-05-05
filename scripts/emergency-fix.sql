-- EMERGENCY FIX FOR INSTITUTIONS TABLE
-- This script fixes all issues with the institutions table

-- Step 1: Ensure the table exists with correct columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'institutions') THEN
    CREATE TABLE public.institutions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      name TEXT NOT NULL,
      subdomain TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      favicon_url TEXT,
      primary_color TEXT,
      is_active BOOLEAN DEFAULT true
    );
  END IF;
END
$$;

-- Step 2: Disable RLS temporarily
ALTER TABLE public.institutions DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies
DROP POLICY IF EXISTS "Allow public access to active institutions" ON public.institutions;
DROP POLICY IF EXISTS "Super admins can do everything" ON public.institutions;
DROP POLICY IF EXISTS "Admins can see their own institution" ON public.institutions;
DROP POLICY IF EXISTS "Users can see their own institution" ON public.institutions;

-- Step 4: Make sure the table is accessible to everyone
GRANT SELECT ON public.institutions TO anon;
GRANT SELECT ON public.institutions TO authenticated;
GRANT ALL ON public.institutions TO service_role;

-- Step 5: Insert a test institution if none exists
INSERT INTO public.institutions (name, subdomain, is_active)
SELECT 'Demo Institution', 'demo', true
WHERE NOT EXISTS (SELECT 1 FROM public.institutions WHERE subdomain = 'demo');

-- Step 6: List all institutions for verification
SELECT id, name, subdomain, is_active FROM public.institutions;
