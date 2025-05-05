-- Function to revoke all permissions on institutions table
CREATE OR REPLACE FUNCTION revoke_all_on_institutions()
RETURNS void AS $$
BEGIN
  -- Drop all existing policies on the institutions table
  DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.institutions;
  DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.institutions;
  DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.institutions;
  DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.institutions;
  
  -- Enable RLS on the table
  ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create proper RLS policies for institutions table
CREATE OR REPLACE FUNCTION create_institutions_policies()
RETURNS void AS $$
BEGIN
  -- Create policy for super admins to do everything
  CREATE POLICY "Super admins can do everything" 
    ON public.institutions
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
      )
    );
  
  -- Create policy for admins to see their own institution
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
  
  -- Create policy for managers and students to see their own institution
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
  
  -- Create policy for public access to active institutions (for subdomain validation)
  CREATE POLICY "Public can see active institutions" 
    ON public.institutions
    FOR SELECT
    USING (is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
