-- 1. Drop the old, problematic policies for 'profiles' and 'body_metrics'
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own body metrics" ON public.body_metrics;

-- 2. Create new policies for the 'profiles' table
-- Allow anonymous users to INSERT their initial profile. This is crucial for onboarding.
CREATE POLICY "Allow anonymous users to create a profile"
ON public.profiles FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated users to fully manage their own profile data.
CREATE POLICY "Allow authenticated users to manage their own profile"
ON public.profiles FOR ALL TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- 3. Create new policies for the 'body_metrics' table
-- Allow anonymous users to INSERT their initial body metrics.
CREATE POLICY "Allow anonymous users to insert body metrics"
ON public.body_metrics FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated users to fully manage their own body metrics.
CREATE POLICY "Allow authenticated users to manage their own body metrics"
ON public.body_metrics FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); 