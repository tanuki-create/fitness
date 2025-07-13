-- Final RLS Cleanup and Simplification
-- This migration assumes all users, including first-time visitors,
-- will have a user ID via anonymous sign-in.
-- Therefore, we can remove all special policies for the 'anon' role
-- and rely solely on policies for the 'authenticated' role.

-- 1. Drop all previous, now-redundant policies
-- For profiles table
DROP POLICY IF EXISTS "Allow anonymous users to create a profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own profile" ON public.profiles;
-- For body_metrics table
DROP POLICY IF EXISTS "Allow anonymous users to insert body metrics" ON public.body_metrics;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own body metrics" ON public.body_metrics;
-- For storage objects
DROP POLICY IF EXISTS "Allow anonymous uploads to images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous reads from images bucket" ON storage.objects;
DROP POLICY IF EXISTS "DEBUG: Ultimate permissive insert for anon" ON storage.objects;
DROP POLICY IF EXISTS "DEBUG: Ultimate permissive select for anon" ON storage.objects;

-- 2. Re-create simple, secure, ownership-based policies for the 'authenticated' role.
-- Now that every user has a UID, 'authenticated' covers both signed-up and anonymous users.

-- For profiles
CREATE POLICY "Users can manage their own profile"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- For body metrics
CREATE POLICY "Users can manage their own body metrics"
ON public.body_metrics FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- For storage (images bucket)
CREATE POLICY "Authenticated users can upload to the images bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
TO authenticated
USING (auth.uid() = owner);

-- The ALTER TABLE command will be run manually via the SQL Editor
-- as the CLI user does not have permission.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 