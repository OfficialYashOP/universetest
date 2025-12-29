-- ============================================
-- REMOVE ACCOUNT VERIFICATION REQUIREMENT
-- ============================================

-- 1. Update handle_new_user to set users as active by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_full_name TEXT;
  v_university_id UUID;
  v_role app_role;
  v_username TEXT;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if this email is in admin_seeds
  SELECT EXISTS (SELECT 1 FROM admin_seeds WHERE email = new.email) INTO v_is_admin;
  
  -- Validate and sanitize full_name
  v_full_name := TRIM(new.raw_user_meta_data ->> 'full_name');
  IF v_full_name IS NULL OR LENGTH(v_full_name) < 2 THEN
    RAISE EXCEPTION 'Full name must be at least 2 characters';
  END IF;
  IF LENGTH(v_full_name) > 100 THEN
    v_full_name := LEFT(v_full_name, 100);
  END IF;
  
  -- Validate and sanitize username
  v_username := LOWER(TRIM(new.raw_user_meta_data ->> 'username'));
  IF v_username IS NOT NULL AND v_username != '' THEN
    IF v_username !~ '^[a-z0-9_]{3,30}$' THEN
      RAISE EXCEPTION 'Username must be 3-30 characters, lowercase letters, numbers, and underscores only';
    END IF;
    IF EXISTS (SELECT 1 FROM profiles WHERE username = v_username) THEN
      RAISE EXCEPTION 'Username already taken';
    END IF;
  ELSE
    v_username := NULL;
  END IF;
  
  -- Validate university exists and is active
  IF new.raw_user_meta_data ->> 'university_id' IS NOT NULL THEN
    BEGIN
      v_university_id := (new.raw_user_meta_data ->> 'university_id')::uuid;
      IF NOT EXISTS (
        SELECT 1 FROM universities 
        WHERE id = v_university_id AND is_active = true
      ) THEN
        RAISE EXCEPTION 'Invalid or inactive university';
      END IF;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid UUID format for university_id';
    END;
  END IF;
  
  -- Determine role
  IF v_is_admin THEN
    v_role := 'admin';
  ELSE
    BEGIN
      v_role := (new.raw_user_meta_data ->> 'role')::app_role;
      IF v_role NOT IN ('student', 'senior', 'alumni', 'partner_vendor') THEN
        RAISE EXCEPTION 'Invalid role for signup';
      END IF;
    EXCEPTION WHEN invalid_text_representation THEN
      v_role := 'student';
    END;
  END IF;
  
  -- Insert profile - ALL users are now active by default (no verification required)
  INSERT INTO public.profiles (id, email, full_name, university_id, username, is_active, account_status, is_verified)
  VALUES (
    new.id, 
    new.email, 
    v_full_name, 
    v_university_id, 
    v_username,
    true,  -- Always active
    'active',  -- Always active status
    true  -- Mark as verified
  );
  
  -- Insert validated role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_role);
  
  RETURN new;
END;
$function$;

-- 2. Update all existing users to be active
UPDATE public.profiles SET is_active = true, account_status = 'active', is_verified = true WHERE is_active = false OR account_status != 'active';

-- 3. Drop and recreate RLS policies WITHOUT is_account_active checks

-- posts table
DROP POLICY IF EXISTS "Users can create posts in their university" ON posts;
CREATE POLICY "Users can create posts in their university" ON posts
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND university_id = get_user_university(auth.uid())
);

-- post_comments table
DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
CREATE POLICY "Users can create comments" ON post_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- post_likes table
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
CREATE POLICY "Users can like posts" ON post_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- chat_rooms table
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;
CREATE POLICY "Users can create chat rooms" ON chat_rooms
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- chat_messages table
DROP POLICY IF EXISTS "Participants can send messages" ON chat_messages;
CREATE POLICY "Participants can send messages" ON chat_messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id 
  AND is_chat_participant(auth.uid(), room_id)
);

-- messages table
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
CREATE POLICY "Users can send messages to their conversations" ON messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id 
  AND is_conversation_participant(auth.uid(), conversation_id)
);

-- stories table
DROP POLICY IF EXISTS "Users can create their own stories" ON stories;
CREATE POLICY "Users can create their own stories" ON stories
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND university_id = get_user_university(auth.uid())
);

-- story_replies table
DROP POLICY IF EXISTS "Users can reply to stories" ON story_replies;
CREATE POLICY "Users can reply to stories" ON story_replies
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- reports table
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports" ON reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- academic_resources table
DROP POLICY IF EXISTS "Users can create resources" ON academic_resources;
CREATE POLICY "Users can create resources" ON academic_resources
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND university_id = get_user_university(auth.uid())
);

-- housing_listings table
DROP POLICY IF EXISTS "Students can create roommate requests only" ON housing_listings;
CREATE POLICY "Students can create roommate requests only" ON housing_listings
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND university_id = get_user_university(auth.uid())
  AND listing_type = 'roommate'
  AND (is_vendor_listing = false OR is_vendor_listing IS NULL)
);

-- marketplace_posts table
DROP POLICY IF EXISTS "Students can create marketplace posts" ON marketplace_posts;
CREATE POLICY "Students can create marketplace posts" ON marketplace_posts
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND university_id = get_user_university(auth.uid())
  AND NOT has_role(auth.uid(), 'partner_vendor')
);

-- roommate_requests table
DROP POLICY IF EXISTS "Students can create roommate requests" ON roommate_requests;
CREATE POLICY "Students can create roommate requests" ON roommate_requests
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND university_id = get_user_university(auth.uid())
  AND NOT has_role(auth.uid(), 'partner_vendor')
);