-- This script fixes issues with the institutions table and its RLS policies

-- Step 1: Ensure the institutions table has the correct structure
DO $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'institutions') THEN
    CREATE TABLE public.institutions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      name TEXT NOT NULL,
      subdomain TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      favicon_url TEXT,
      primary_color TEXT,
      is_active BOOLEAN DEFAULT true,
      plan_id UUID,
      subscription_status TEXT DEFAULT 'active'
    );
  ELSE
    -- Ensure all required columns exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'institutions' AND column_name = 'is_active') THEN
      ALTER TABLE public.institutions ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'institutions' AND column_name = 'subdomain') THEN
      ALTER TABLE public.institutions ADD COLUMN subdomain TEXT UNIQUE;
    END IF;
  END IF;
END
$$;

-- Step 2: Create indexes for better performance
DO $$
BEGIN
  -- Create index on subdomain for faster lookups
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'institutions_subdomain_idx') THEN
    CREATE INDEX institutions_subdomain_idx ON public.institutions(subdomain);
  END IF;
  
  -- Create index on is_active for faster filtering
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'institutions_is_active_idx') THEN
    CREATE INDEX institutions_is_active_idx ON public.institutions(is_active);
  END IF;
  
  -- Create composite index for the common query pattern
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'institutions_subdomain_is_active_idx') THEN
    CREATE INDEX institutions_subdomain_is_active_idx ON public.institutions(subdomain, is_active);
  END IF;
END
$$;

-- Step 3: Create helper functions for RLS policies
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Fix RLS policies
-- First, disable RLS temporarily to avoid issues during updates
ALTER TABLE public.institutions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow public access to active institutions" ON public.institutions;
DROP POLICY IF EXISTS "Super admins can do everything" ON public.institutions;
DROP POLICY IF EXISTS "Admins can see their own institution" ON public.institutions;
DROP POLICY IF EXISTS "Users can see their own institution" ON public.institutions;
DROP POLICY IF EXISTS "Public can see active institutions" ON public.institutions;

-- Re-enable RLS
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- Create new policies

-- Allow anyone to select active institutions (needed for subdomain validation)
CREATE POLICY "Allow public access to active institutions" 
ON public.institutions
FOR SELECT 
USING (is_active = true);

-- Super admins can do everything
CREATE POLICY "Super admins can do everything" 
ON public.institutions
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Admins can see their own institution
CREATE POLICY "Admins can see their own institution" 
ON public.institutions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.institution_id = institutions.id
    AND profiles.role = 'admin'
  )
);

-- All users can see their own institution
CREATE POLICY "Users can see their own institution" 
ON public.institutions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.institution_id = institutions.id
  )
);

-- Step 5: Grant necessary permissions
GRANT SELECT ON public.institutions TO anon;
GRANT SELECT ON public.institutions TO authenticated;
GRANT ALL ON public.institutions TO service_role;

-- Step 6: Create a function to safely get institution by subdomain
-- This function can be called from the middleware without auth
CREATE OR REPLACE FUNCTION public.get_institution_by_subdomain(subdomain_param TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  subdomain TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    i.subdomain,
    i.logo_url,
    i.favicon_url,
    i.primary_color,
    i.is_active
  FROM 
    public.institutions i
  WHERE 
    i.subdomain = subdomain_param
    AND i.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_institution_by_subdomain(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_institution_by_subdomain(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_institution_by_subdomain(TEXT) TO service_role;

-- Step 7: Create a function to check if a subdomain exists
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.check_subdomain_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_subdomain_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_subdomain_exists(TEXT) TO service_role;
