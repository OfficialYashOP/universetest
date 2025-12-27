-- Create a secure function to get minimal profile info for messaging (no sensitive fields)
CREATE OR REPLACE FUNCTION public.get_messaging_profile(profile_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  is_verified boolean
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
    p.is_verified
  FROM public.profiles p
  WHERE p.id = profile_id
    -- Only allow fetching profiles of users in the same university or conversation participants
    AND (
      p.university_id = get_user_university(auth.uid())
      OR EXISTS (
        SELECT 1 FROM conversation_participants cp1
        JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
        WHERE cp1.user_id = auth.uid() AND cp2.user_id = profile_id
      )
    )
$$;

-- Create a secure function to get profiles for multiple users (batch for messaging)
CREATE OR REPLACE FUNCTION public.get_messaging_profiles(profile_ids uuid[])
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  is_verified boolean
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
    p.is_verified
  FROM public.profiles p
  WHERE p.id = ANY(profile_ids)
    AND (
      p.university_id = get_user_university(auth.uid())
      OR EXISTS (
        SELECT 1 FROM conversation_participants cp1
        JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
        WHERE cp1.user_id = auth.uid() AND cp2.user_id = p.id
      )
    )
$$;