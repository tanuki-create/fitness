-- DANGER: This policy is for debugging purposes only.
-- It allows any anonymous user to upload files to the 'images' bucket.
-- This should be replaced with a more secure policy in production.
CREATE POLICY "DEBUG: Allow anonymous uploads to images bucket"
ON storage.objects FOR INSERT TO anon WITH CHECK (
    bucket_id = 'images'
);

-- DANGER: This policy is for debugging purposes only.
-- It allows any anonymous user to read any file in the 'images' bucket.
CREATE POLICY "DEBUG: Allow anonymous reads from images bucket"
ON storage.objects FOR SELECT TO anon USING (
    bucket_id = 'images'
); 