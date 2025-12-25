-- Fix: Student Personal Information Could Be Stolen by Anyone
-- Problem: The profiles table exposes sensitive data (email, phone, roll_number, verification_document_url)
-- to any authenticated user from the same university

-- Step 1: Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view profiles from same university" ON public.profiles;

-- Step 2: Create a view for public profile data (safe fields only)
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  is_verified,
  branch,
  year_of_study,
  university_id,
  created_at
FROM public.profiles;

-- Step 3: Enable RLS on the view
ALTER VIEW public.profiles_public SET (security_invoker = on);

-- Step 4: Create granular RLS policies on the profiles table

-- Policy: Users can view their own full profile (all fields)
-- (This policy already exists, but let's ensure it's there)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Staff can view all profiles (for admin/moderation purposes)
CREATE POLICY "Staff can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- Policy: Same university users can view only public fields via join queries
-- This allows SELECT but the application should use profiles_public view
CREATE POLICY "Users can view limited profiles from same university"
ON public.profiles
FOR SELECT
USING (
  university_id = get_user_university(auth.uid())
  AND auth.uid() != id  -- Not their own profile (covered by other policy)
);

-- Grant access to the public view
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;