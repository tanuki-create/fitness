-- Step 1: Drop the incorrect debugging policies that were created.
-- These policies were too restrictive and only allowed 'authenticated' users.

DROP POLICY IF EXISTS "Enable ALL for authenticated users (temporary for debug)" ON public.profiles;
DROP POLICY IF EXISTS "Enable ALL for authenticated users (temporary for debug)" ON public.body_metrics;


-- Step 2: Re-create the correct policies that work for BOTH anonymous and authenticated users.
-- The key is to check against `auth.uid()`, which exists for any user with a session.

-- RLS Policies for profiles
CREATE POLICY "Users can manage their own profile"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- RLS Policies for body_metrics
CREATE POLICY "Users can manage their own body metrics"
ON public.body_metrics
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
