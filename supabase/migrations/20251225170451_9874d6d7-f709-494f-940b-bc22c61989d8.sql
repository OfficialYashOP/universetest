-- Create university requests table
CREATE TABLE public.university_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  university_name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  role TEXT NOT NULL, -- student/alumni/staff
  department TEXT,
  interest_count TEXT,
  reason TEXT,
  proof_file_url TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- new/reviewed/contacted/approved/rejected
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.university_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert requests (public form)
CREATE POLICY "Anyone can submit university requests"
ON public.university_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only staff can view all requests
CREATE POLICY "Staff can view all requests"
ON public.university_requests
FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- Only staff can update requests
CREATE POLICY "Staff can update requests"
ON public.university_requests
FOR UPDATE
USING (has_role(auth.uid(), 'staff'));

-- Add trigger for updated_at
CREATE TRIGGER update_university_requests_updated_at
BEFORE UPDATE ON public.university_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for request proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('request-proofs', 'request-proofs', false);

-- Storage policies for request proofs
CREATE POLICY "Anyone can upload request proofs"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'request-proofs');

CREATE POLICY "Staff can view request proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'request-proofs' AND has_role(auth.uid(), 'staff'));