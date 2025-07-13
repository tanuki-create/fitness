-- Drop the potentially broken RLS policies for storage objects
DROP POLICY IF EXISTS "DEBUG: Allow anonymous uploads to images bucket" ON storage.objects;
DROP POLICY IF EXISTS "DEBUG: Allow anonymous reads from images bucket" ON storage.objects;

-- Recreate the policies correctly

-- Allow anonymous users to SELECT (read) files from the 'images' bucket.
-- This is required for getPublicUrl to work.
CREATE POLICY "Allow anonymous reads from images bucket"
ON storage.objects FOR SELECT TO anon USING (
    bucket_id = 'images'
);

-- Allow anonymous users to INSERT (upload) files into the 'images' bucket.
CREATE POLICY "Allow anonymous uploads to images bucket"
ON storage.objects FOR INSERT TO anon WITH CHECK (
    bucket_id = 'images'
); 