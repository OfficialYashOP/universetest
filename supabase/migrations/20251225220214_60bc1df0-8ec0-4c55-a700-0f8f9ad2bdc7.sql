-- Add username and profile fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_link TEXT,
ADD COLUMN IF NOT EXISTS snapchat_link TEXT,
ADD COLUMN IF NOT EXISTS recovery_email TEXT,
ADD COLUMN IF NOT EXISTS username_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS full_name_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending_verification';

-- Create index on username for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- Create community_groups table (fixed 5 groups)
CREATE TABLE IF NOT EXISTS public.community_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on community_groups
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;

-- Anyone can view community groups
CREATE POLICY "Anyone can view community groups"
ON public.community_groups FOR SELECT
USING (true);

-- Only staff can manage groups
CREATE POLICY "Staff can manage community groups"
ON public.community_groups FOR ALL
USING (has_role(auth.uid(), 'staff'));

-- Insert the 5 fixed community groups
INSERT INTO public.community_groups (name, slug, description, icon, display_order) VALUES
('General', 'general', 'General discussions and announcements', 'MessageSquare', 1),
('Freshers', 'freshers', 'Welcome freshers! Ask questions and connect', 'Sparkles', 2),
('Seniors', 'seniors', 'Senior students discussions and mentorship', 'GraduationCap', 3),
('Housing & Living', 'housing-living', 'Housing, roommates, and campus living', 'Home', 4),
('Academics', 'academics', 'Study groups, resources, and academic help', 'BookOpen', 5)
ON CONFLICT (slug) DO NOTHING;

-- Add group_id to posts table for community group posts
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.community_groups(id);

-- Create index for group posts
CREATE INDEX IF NOT EXISTS idx_posts_group_id ON public.posts (group_id);

-- Create admin_seeds table to seed admin accounts
CREATE TABLE IF NOT EXISTS public.admin_seeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Enable RLS (only staff can access)
ALTER TABLE public.admin_seeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only staff can view admin seeds"
ON public.admin_seeds FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- Create function to check if username is available
CREATE OR REPLACE FUNCTION public.check_username_available(check_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles WHERE username = LOWER(check_username)
  )
$$;

-- Create function to check if user can edit username/name (30 day limit)
CREATE OR REPLACE FUNCTION public.can_edit_profile_field(user_id UUID, field_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_update TIMESTAMP WITH TIME ZONE;
BEGIN
  IF field_name = 'username' THEN
    SELECT username_updated_at INTO last_update FROM profiles WHERE id = user_id;
  ELSIF field_name = 'full_name' THEN
    SELECT full_name_updated_at INTO last_update FROM profiles WHERE id = user_id;
  ELSE
    RETURN true;
  END IF;
  
  IF last_update IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN last_update < NOW() - INTERVAL '30 days';
END;
$$;

-- Create function to check if user account is active
CREATE OR REPLACE FUNCTION public.is_account_active(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(is_active, false) FROM profiles WHERE id = user_id
$$;

-- Update handle_new_user function to support username and admin check
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
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
    -- Validate username format (lowercase, no spaces, alphanumeric with underscores)
    IF v_username !~ '^[a-z0-9_]{3,30}$' THEN
      RAISE EXCEPTION 'Username must be 3-30 characters, lowercase letters, numbers, and underscores only';
    END IF;
    -- Check uniqueness
    IF EXISTS (SELECT 1 FROM profiles WHERE username = v_username) THEN
      RAISE EXCEPTION 'Username already taken';
    END IF;
  ELSE
    v_username := NULL;
  END IF;
  
  -- Validate university exists and is active (only for non-partner signups)
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
  
  -- Insert validated profile
  INSERT INTO public.profiles (id, email, full_name, university_id, username, is_active, account_status)
  VALUES (
    new.id, 
    new.email, 
    v_full_name, 
    v_university_id, 
    v_username,
    CASE WHEN v_is_admin THEN true ELSE false END,
    CASE WHEN v_is_admin THEN 'active' ELSE 'pending_verification' END
  );
  
  -- Insert validated role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_role);
  
  RETURN new;
END;
$$;