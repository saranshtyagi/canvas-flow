-- Drop the permissive policy that allows all operations
DROP POLICY IF EXISTS "Allow all operations on canvases " ON public.canvases;

-- Create restrictive policies that deny direct access (all operations go through edge function)
-- Since the edge function uses the service role key, it bypasses RLS
-- These policies ensure that if anyone tries to access directly, they are denied

CREATE POLICY "Deny direct access - use edge function"
ON public.canvases
FOR ALL
USING (false)
WITH CHECK (false);