-- Create storage bucket for adega logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('adega-logos', 'adega-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their adega logo
CREATE POLICY "Users can upload their adega logo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'adega-logos' 
  AND (storage.foldername(name))[1] = get_user_adega_id(auth.uid())::text
);

-- Allow authenticated users to update their adega logo
CREATE POLICY "Users can update their adega logo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'adega-logos' 
  AND (storage.foldername(name))[1] = get_user_adega_id(auth.uid())::text
);

-- Allow authenticated users to delete their adega logo
CREATE POLICY "Users can delete their adega logo"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'adega-logos' 
  AND (storage.foldername(name))[1] = get_user_adega_id(auth.uid())::text
);

-- Allow public read access to adega logos
CREATE POLICY "Public can view adega logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'adega-logos');