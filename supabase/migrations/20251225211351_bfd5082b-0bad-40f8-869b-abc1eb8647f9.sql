-- FIX 1: Housing Contact Phone Exposure
-- Create a function that returns housing listings with contact info only visible to owners
-- This prevents other students from seeing personal phone numbers

CREATE OR REPLACE FUNCTION public.get_housing_listings_safe(university_filter uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  listing_type text,
  price numeric,
  location text,
  address text,
  room_type text,
  gender_preference text,
  amenities text[],
  images text[],
  status listing_status,
  is_verified boolean,
  is_vendor_listing boolean,
  user_id uuid,
  partner_id uuid,
  university_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  contact_phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    h.id,
    h.title,
    h.description,
    h.listing_type,
    h.price,
    h.location,
    h.address,
    h.room_type,
    h.gender_preference,
    h.amenities,
    h.images,
    h.status,
    h.is_verified,
    h.is_vendor_listing,
    h.user_id,
    h.partner_id,
    h.university_id,
    h.created_at,
    h.updated_at,
    -- Only show contact phone to the owner of the listing
    CASE 
      WHEN h.user_id = auth.uid() THEN h.contact_phone
      ELSE NULL
    END as contact_phone
  FROM public.housing_listings h
  WHERE h.university_id = university_filter
    AND h.university_id = get_user_university(auth.uid())
$$;

-- FIX 2: Profiles Table - Already secured with proper RLS
-- RLS is enabled and policies restrict access to:
-- - Users viewing their own profile
-- - Staff viewing all profiles
-- The get_public_profiles() function provides safe access to public fields
-- Adding explicit comment for documentation
COMMENT ON TABLE public.profiles IS 'User profiles with sensitive data protected by RLS. Use get_public_profiles() to access other users public info safely.';