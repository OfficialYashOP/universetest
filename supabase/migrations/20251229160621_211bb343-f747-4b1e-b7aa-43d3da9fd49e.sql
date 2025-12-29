-- ============================================
-- VERIFICATION APPLICATION SYSTEM - COMPLETE
-- ============================================

-- 1. Create verification_applications table
CREATE TABLE public.verification_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  
  -- Academic Details
  university_id UUID,
  roll_number TEXT,
  branch TEXT,
  year_of_study TEXT,
  
  -- Document URLs (stored in storage bucket)
  college_id_front_url TEXT,
  college_id_back_url TEXT,
  fee_receipt_url TEXT,
  aadhaar_front_url TEXT,
  aadhaar_back_url TEXT,
  selfie_url TEXT,
  
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one application per user
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.verification_applications ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies for verification_applications
CREATE POLICY "Users can view own verification apps"
ON public.verification_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own verification apps"
ON public.verification_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending apps"
ON public.verification_applications FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all verification apps"
ON public.verification_applications FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can update verification apps"
ON public.verification_applications FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- 3. Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage policies for verification-docs bucket (unique names)
CREATE POLICY "Upload to verification-docs bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "View own verification-docs files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins view verification-docs files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-docs' 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
);

CREATE POLICY "Update own verification-docs files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'verification-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Approval function
CREATE OR REPLACE FUNCTION public.approve_verification_application(application_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  SELECT user_id INTO v_user_id FROM verification_applications WHERE id = application_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  UPDATE verification_applications
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  WHERE id = application_id;
  
  UPDATE profiles
  SET is_verified = true, verification_status = 'verified', updated_at = now()
  WHERE id = v_user_id;
END;
$$;

-- 6. Rejection function
CREATE OR REPLACE FUNCTION public.reject_verification_application(application_id UUID, rejection_notes TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  SELECT user_id INTO v_user_id FROM verification_applications WHERE id = application_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  UPDATE verification_applications
  SET status = 'rejected', admin_notes = rejection_notes, reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  WHERE id = application_id;
  
  UPDATE profiles
  SET verification_status = 'rejected', updated_at = now()
  WHERE id = v_user_id;
END;
$$;

-- 7. Trigger for updated_at
CREATE TRIGGER update_verification_applications_updated_at
BEFORE UPDATE ON public.verification_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();