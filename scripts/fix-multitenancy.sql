-- COMPREHENSIVE FIX FOR MULTI-TENANCY
-- This script fixes all issues with the institutions table and RPC functions

-- Step 1: Fix the institutions table structure
DO $$
BEGIN
  -- Ensure the table exists with correct columns
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

-- Step 2: Disable RLS temporarily to avoid issues
ALTER TABLE public.institutions DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow public access to active institutions" ON public.institutions;
DROP POLICY IF EXISTS "Super admins can do everything" ON public.institutions;
DROP POLICY IF EXISTS "Admins can see their own institution" ON public.institutions;
DROP POLICY IF EXISTS "Users can see their own institution" ON public.institutions;

-- Step 4: Create a simple policy that allows anyone to read active institutions
CREATE POLICY "Allow public read access to active institutions" 
ON public.institutions
FOR SELECT 
USING (is_active = true);

-- Step 5: Re-enable RLS
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing functions to recreate them
DROP FUNCTION IF EXISTS public.check_subdomain_exists(TEXT);
DROP FUNCTION IF EXISTS public.get_institution_by_subdomain(TEXT);

-- Step 7: Create a simple function to check if a subdomain exists
CREATE OR REPLACE FUNCTION public.check_subdomain_exists(subdomain_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.institutions
    WHERE subdomain = subdomain_param
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create a function to get institution by subdomain
-- This function returns a JSON object instead of a table for simplicity
CREATE OR REPLACE FUNCTION public.get_institution_by_subdomain(subdomain_param TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'subdomain', subdomain,
    'logo_url', logo_url,
    'favicon_url', favicon_url,
    'primary_color', primary_color,
    'is_active', is_active
  ) INTO result
  FROM public.institutions
  WHERE subdomain = subdomain_param
  AND is_active = true;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Grant necessary permissions
GRANT SELECT ON public.institutions TO anon;
GRANT SELECT ON public.institutions TO authenticated;
GRANT ALL ON public.institutions TO service_role;

GRANT EXECUTE ON FUNCTION public.check_subdomain_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_subdomain_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_subdomain_exists(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.get_institution_by_subdomain(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_institution_by_subdomain(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_institution_by_subdomain(TEXT) TO service_role;

-- Step 10: Insert a test institution if none exists
INSERT INTO public.institutions (name, subdomain, is_active)
SELECT 'Demo Institution', 'demo', true
WHERE NOT EXISTS (SELECT 1 FROM public.institutions WHERE subdomain = 'demo');
