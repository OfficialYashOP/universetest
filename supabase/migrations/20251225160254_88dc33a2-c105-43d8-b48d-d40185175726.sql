-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-documents', 'verification-documents', false);

-- Create storage bucket for avatars (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- RLS policies for verification-documents bucket
CREATE POLICY "Users can upload their own verification documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own verification documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own verification documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own verification documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);