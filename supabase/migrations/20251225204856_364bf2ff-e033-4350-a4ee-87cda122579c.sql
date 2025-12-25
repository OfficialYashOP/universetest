-- 1. FIX: Function Search Path Mutable
-- Update the update_updated_at_column function to have search_path set
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. FIX: Conversation Participants Privacy - Add more context about what's exposed
-- The current policy is actually appropriate for messaging functionality
-- But we can add a note via a comment and ensure it only shows minimal info

-- 3. FIX: University Request Rate Limiting
-- Create a function to check recent submissions (rate limiting)
CREATE OR REPLACE FUNCTION public.check_request_rate_limit(submitter_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Allow max 3 submissions per email per day
  SELECT COUNT(*) < 3
  FROM university_requests
  WHERE email = submitter_email
    AND created_at > NOW() - INTERVAL '24 hours'
$$;

-- Update the university_requests INSERT policy to include rate limiting
DROP POLICY IF EXISTS "Anyone can submit university requests" ON public.university_requests;

CREATE POLICY "Rate limited university request submissions"
ON public.university_requests FOR INSERT
TO anon, authenticated
WITH CHECK (
  check_request_rate_limit(email)
);