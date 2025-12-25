-- 1. FIX: Medical Staff Personal Phone Numbers Exposed
-- Create a security definer function to expose only office contacts, not personal ones
CREATE OR REPLACE FUNCTION public.get_health_staff_public()
RETURNS TABLE (
  id uuid,
  name text,
  role_type text,
  specialization text,
  designation text,
  office_contact text,
  timings text,
  uid text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    role_type,
    specialization,
    designation,
    office_contact,
    timings,
    uid,
    created_at
  FROM public.lpu_health_staff
$$;

-- 2. FIX: Anonymous File Upload Enables Storage Abuse
-- Drop the overly permissive policy and create restricted one
DROP POLICY IF EXISTS "Anyone can upload request proofs" ON storage.objects;

CREATE POLICY "Restricted request proof uploads"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'request-proofs' AND
  (storage.foldername(name))[1] IS NOT NULL AND
  LOWER(split_part(name, '.', -1)) IN ('pdf', 'jpg', 'jpeg', 'png') AND
  octet_length(name) < 500
);

-- 3. FIX: Users Can Self-Assign Admin Roles (CRITICAL)
-- Remove the dangerous INSERT policy entirely
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Roles are ONLY assigned via the handle_new_user trigger during signup
-- Create admin-only function for role management if needed later
CREATE OR REPLACE FUNCTION public.admin_assign_role(
  target_user_id UUID,
  new_role app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only staff can assign roles
  IF NOT has_role(auth.uid(), 'staff') THEN
    RAISE EXCEPTION 'Unauthorized: Only staff can assign roles';
  END IF;
  
  -- Prevent assigning staff role through this function
  IF new_role = 'staff' THEN
    RAISE EXCEPTION 'Cannot assign staff role via this function';
  END IF;
  
  -- Insert role (ignore if already exists)
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- 4. FIX: User Signup Lacks Server-Side Input Validation
-- Replace handle_new_user with validated version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_university_id UUID;
  v_role app_role;
BEGIN
  -- Validate and sanitize full_name
  v_full_name := TRIM(new.raw_user_meta_data ->> 'full_name');
  IF v_full_name IS NULL OR LENGTH(v_full_name) < 2 THEN
    RAISE EXCEPTION 'Full name must be at least 2 characters';
  END IF;
  IF LENGTH(v_full_name) > 100 THEN
    v_full_name := LEFT(v_full_name, 100);
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
  
  -- Validate role - only allow student, senior, alumni, partner_vendor for signup
  BEGIN
    v_role := (new.raw_user_meta_data ->> 'role')::app_role;
    IF v_role NOT IN ('student', 'senior', 'alumni', 'partner_vendor') THEN
      RAISE EXCEPTION 'Invalid role for signup';
    END IF;
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'student'; -- Default to student if invalid
  END;
  
  -- Insert validated profile
  INSERT INTO public.profiles (id, email, full_name, university_id)
  VALUES (new.id, new.email, v_full_name, v_university_id);
  
  -- Insert validated role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_role);
  
  RETURN new;
END;
$$;

-- 5. FIX: Delete the already-fixed profiles_table_public_exposure finding
-- (This was fixed in previous migrations with get_public_profile functions)