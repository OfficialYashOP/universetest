-- Fix: Student Email/Phone Could Be Harvested
-- Remove the permissive policy that allows same-university access to ALL columns
-- The profiles_public view will provide safe access to public fields only

-- Step 1: Drop the permissive policy that exposes sensitive columns
DROP POLICY IF EXISTS "Users can view limited profiles from same university" ON public.profiles;

-- Step 2: Recreate the view WITHOUT security_invoker so it bypasses RLS
-- The view itself enforces the university restriction via WHERE clause
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public 
WITH (security_barrier = true)
AS
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
FROM public.profiles
WHERE university_id = get_user_university(auth.uid());

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO authenticated;

-- Now the profiles table only allows:
-- 1. Users viewing their OWN full profile (email, phone, etc.)
-- 2. Staff viewing ALL profiles (for admin purposes)
-- 3. NO access for same-university users to the main table (use view instead)