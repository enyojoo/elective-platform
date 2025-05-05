-- Drop all existing policies on the profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles in their institution" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view profiles in their institution" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public profile creation during signup" ON profiles;

-- Enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user is an admin without recursion
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Directly query the table without going through RLS
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is a super admin without recursion
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Directly query the table without going through RLS
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get a user's institution_id without recursion
CREATE OR REPLACE FUNCTION get_user_institution_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
  user_institution_id UUID;
BEGIN
  -- Directly query the table without going through RLS
  SELECT institution_id INTO user_institution_id FROM profiles WHERE id = user_id;
  RETURN user_institution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles in their institution using the helper function
CREATE POLICY "Admins can view profiles in their institution"
ON profiles FOR SELECT
USING (
  is_admin(auth.uid()) AND 
  institution_id = get_user_institution_id(auth.uid())
);

-- Allow super admins to view all profiles using the helper function
CREATE POLICY "Super admins can view all profiles"
ON profiles FOR SELECT
USING (is_super_admin(auth.uid()));

-- Allow super admins to update all profiles using the helper function
CREATE POLICY "Super admins can update all profiles"
ON profiles FOR UPDATE
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Allow super admins to insert profiles using the helper function
CREATE POLICY "Super admins can insert profiles"
ON profiles FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

-- Allow super admins to delete profiles using the helper function
CREATE POLICY "Super admins can delete profiles"
ON profiles FOR DELETE
USING (is_super_admin(auth.uid()));

-- Allow public access for profile creation during signup
CREATE POLICY "Allow public profile creation during signup"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
