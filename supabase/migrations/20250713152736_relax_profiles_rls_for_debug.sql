-- For debugging purposes, temporarily relax the RLS policies on the profiles table.
-- This helps determine if the issue is with the policy logic itself or elsewhere.

-- Drop existing specific policies
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- Create a single, permissive policy for all actions
CREATE POLICY "Enable ALL for authenticated users (temporary for debug)" 
ON public.profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
