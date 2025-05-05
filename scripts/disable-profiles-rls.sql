-- TEMPORARY FIX: Completely disable RLS for profiles table
-- This is a temporary measure to fix the infinite recursion issue
-- WARNING: This reduces security but allows the application to function
-- TODO: Implement proper RLS policies after investigating the root cause

-- First, drop all existing policies on the profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view profiles in their institution" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins view institution profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins delete profiles" ON profiles;
DROP POLICY IF EXISTS "Public profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Auth system can read all profiles" ON profiles;

-- Disable RLS completely for the profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Add a comment to the table to indicate this is temporary
COMMENT ON TABLE profiles IS 'User profiles table. WARNING: RLS currently disabled as a temporary fix for infinite recursion issues.';

-- Create a simple policy that allows all operations for authenticated users
-- This won't be active while RLS is disabled, but will be ready when we re-enable it
CREATE POLICY "Allow all operations for authenticated users" 
ON profiles
FOR ALL
USING (auth.role() = 'authenticated');

-- Create a simple policy that allows service role to access all profiles
-- This won't be active while RLS is disabled, but will be ready when we re-enable it
CREATE POLICY "Allow service role full access" 
ON profiles
FOR ALL
USING (auth.role() = 'service_role');
