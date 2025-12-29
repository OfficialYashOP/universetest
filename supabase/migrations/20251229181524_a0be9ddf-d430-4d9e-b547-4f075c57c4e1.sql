-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);
DROP FUNCTION IF EXISTS public.get_public_profiles();

-- Recreate get_public_profile function with verification_status
CREATE FUNCTION public.get_public_profile(profile_id uuid)
 RETURNS TABLE(id uuid, full_name text, avatar_url text, bio text, is_verified boolean, branch text, year_of_study text, university_id uuid, created_at timestamp with time zone, verification_status verification_status)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.is_verified,
    p.branch,
    p.year_of_study,
    p.university_id,
    p.created_at,
    p.verification_status
  FROM public.profiles p
  WHERE p.id = profile_id
    AND p.university_id = get_user_university(auth.uid())
$function$;

-- Recreate get_public_profiles function with verification_status
CREATE FUNCTION public.get_public_profiles()
 RETURNS TABLE(id uuid, full_name text, avatar_url text, bio text, is_verified boolean, branch text, year_of_study text, university_id uuid, created_at timestamp with time zone, verification_status verification_status)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.is_verified,
    p.branch,
    p.year_of_study,
    p.university_id,
    p.created_at,
    p.verification_status
  FROM public.profiles p
  WHERE p.university_id = get_user_university(auth.uid())
$function$;