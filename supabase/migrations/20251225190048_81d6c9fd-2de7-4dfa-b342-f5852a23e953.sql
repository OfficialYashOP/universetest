-- Fix: Security Definer View
-- Replace the view with a SECURITY DEFINER function (recommended pattern)

-- Step 1: Drop the security definer view
DROP VIEW IF EXISTS public.profiles_public;

-- Step 2: Create a SECURITY DEFINER function instead
-- Functions with SECURITY DEFINER are the standard pattern for controlled data access
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN,
  branch TEXT,
  year_of_study TEXT,
  university_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.is_verified,
    p.branch,
    p.year_of_study,
    p.university_id,
    p.created_at
  FROM public.profiles p
  WHERE p.university_id = get_user_university(auth.uid())
$$;

-- Step 3: Create a function to get a single public profile by ID
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN,
  branch TEXT,
  year_of_study TEXT,
  university_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.is_verified,
    p.branch,
    p.year_of_study,
    p.university_id,
    p.created_at
  FROM public.profiles p
  WHERE p.id = profile_id
    AND p.university_id = get_user_university(auth.uid())
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile(UUID) TO authenticated;