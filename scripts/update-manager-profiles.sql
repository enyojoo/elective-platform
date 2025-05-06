-- Add new columns to manager_profiles table
ALTER TABLE public.manager_profiles 
ADD COLUMN IF NOT EXISTS degree_id UUID REFERENCES public.degrees(id),
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id);

-- Update RLS policies for manager_profiles
ALTER TABLE public.manager_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Managers can view their own profiles" ON public.manager_profiles;
DROP POLICY IF EXISTS "Admins can view all manager profiles" ON public.manager_profiles;
DROP POLICY IF EXISTS "Admins can insert manager profiles" ON public.manager_profiles;
DROP POLICY IF EXISTS "Admins can update manager profiles" ON public.manager_profiles;

-- Create new policies
CREATE POLICY "Managers can view their own profiles" 
ON public.manager_profiles FOR SELECT 
TO authenticated 
USING (
  auth.uid() = profile_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
  )
);

CREATE POLICY "Admins can view all manager profiles" 
ON public.manager_profiles FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
  )
);

CREATE POLICY "Admins can insert manager profiles" 
ON public.manager_profiles FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
  )
);

CREATE POLICY "Admins can update manager profiles" 
ON public.manager_profiles FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
  )
);
