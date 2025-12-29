-- Fix handle_new_user function to NOT set is_verified = true by default
-- New users should start as NOT verified, with null verification_status
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
  
  -- Insert profile - Users are active but NOT verified by default
  -- is_verified = false, verification_status = NULL (not applied yet)
  INSERT INTO public.profiles (id, email, full_name, university_id, username, is_active, account_status, is_verified, verification_status)
  VALUES (
    new.id, 
    new.email, 
    v_full_name, 
    v_university_id, 
    v_username,
    true,  -- Active (can use platform)
    'active',  -- Active status
    false,  -- NOT verified (no blue tick)
    NULL  -- No verification status (hasn't applied)
  );
  
  -- Insert validated role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_role);
  
  RETURN new;
END;
$function$;

-- Also update existing users who were incorrectly set as verified
-- but don't have an approved verification application
UPDATE public.profiles p
SET is_verified = false, verification_status = NULL
WHERE p.is_verified = true
  AND NOT EXISTS (
    SELECT 1 FROM verification_applications va
    WHERE va.user_id = p.id AND va.status = 'approved'
  );