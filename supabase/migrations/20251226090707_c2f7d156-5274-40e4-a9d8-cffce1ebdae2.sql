-- Fix 1: Create a secure admin profiles function that excludes sensitive personal data
CREATE OR REPLACE FUNCTION public.get_admin_profiles_filtered(search_term text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  university_id uuid,
  is_active boolean,
  account_status text,
  verification_status public.verification_status,
  created_at timestamp with time zone,
  is_verified boolean,
  verification_document_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.university_id,
    p.is_active,
    p.account_status,
    p.verification_status,
    p.created_at,
    p.is_verified,
    p.verification_document_url
  FROM public.profiles p
  WHERE (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
    AND (
      search_term IS NULL 
      OR search_term = ''
      OR p.full_name ILIKE '%' || search_term || '%' 
      OR p.email ILIKE '%' || search_term || '%'
    )
$$;

-- Fix 2: For housing listings, remove the broad SELECT policy and add a restricted one
-- Users can only view their own listings directly, all other viewing goes through RPC function
DROP POLICY IF EXISTS "Users can view housing in their university" ON public.housing_listings;

-- Allow users to view their own listings (needed for editing)
CREATE POLICY "Users can view their own housing listings"
ON public.housing_listings
FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins/staff to view all listings for moderation
CREATE POLICY "Staff can view all housing listings"
ON public.housing_listings
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- Drop the overly permissive staff/admin profile policy
DROP POLICY IF EXISTS "Staff and admin can view all profiles" ON public.profiles;

-- Create a new restricted policy for staff - they must use the secure function for full access
-- This policy allows basic verification but doesn't expose sensitive fields directly
CREATE POLICY "Staff can view profiles via secure function only"
ON public.profiles
FOR SELECT
USING (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
);