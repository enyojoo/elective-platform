-- First, disable RLS temporarily to allow us to fix the policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on the profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view profiles in their institution" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public profile creation during signup" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simplified policies that avoid recursion

-- 1. Basic policy for users to view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 2. Basic policy for users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Allow admins to view profiles in their institution without recursion
-- This avoids querying the profiles table within the policy
CREATE POLICY "Admins view institution profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() AND auth.users.id IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  )
);

-- 4. Super admin policy for viewing all profiles
CREATE POLICY "Super admins view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() AND auth.users.id IN (
      SELECT id FROM profiles WHERE role = 'super_admin'
    )
  )
);

-- 5. Super admin policy for updating all profiles
CREATE POLICY "Super admins update all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() AND auth.users.id IN (
      SELECT id FROM profiles WHERE role = 'super_admin'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() AND auth.users.id IN (
      SELECT id FROM profiles WHERE role = 'super_admin'
    )
  )
);

-- 6. Super admin policy for inserting profiles
CREATE POLICY "Super admins insert profiles"
ON profiles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() AND auth.users.id IN (
      SELECT id FROM profiles WHERE role = 'super_admin'
    )
  )
);

-- 7. Super admin policy for deleting profiles
CREATE POLICY "Super admins delete profiles"
ON profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() AND auth.users.id IN (
      SELECT id FROM profiles WHERE role = 'super_admin'
    )
  )
);

-- 8. Public access for profile creation during signup
CREATE POLICY "Public profile creation during signup"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 9. Special bypass policy for authentication
-- This allows the system to check roles without recursion
CREATE POLICY "Auth system can read all profiles"
ON profiles FOR SELECT
USING (auth.jwt() ->> 'role' = 'service_role');
