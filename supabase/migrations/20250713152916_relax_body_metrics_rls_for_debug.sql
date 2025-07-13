-- For debugging purposes, temporarily relax the RLS policies on the body_metrics table.

-- Drop existing general policy
DROP POLICY IF EXISTS "Enable ALL for anonymous users" ON public.body_metrics;

-- Create a single, permissive policy for all actions for authenticated users
CREATE POLICY "Enable ALL for authenticated users (temporary for debug)" 
ON public.body_metrics
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
