-- Drop existing policies that won't work with Clerk
DROP POLICY IF EXISTS "Users can view org canvases" ON public.canvases;
DROP POLICY IF EXISTS "Users can create canvases" ON public.canvases;
DROP POLICY IF EXISTS "Users can update own canvases" ON public.canvases;
DROP POLICY IF EXISTS "Users can delete own canvases" ON public.canvases;

-- Create permissive policies for Clerk-based auth
-- Since Clerk handles auth, we allow all operations and validate in application layer
CREATE POLICY "Allow all operations on canvases" 
ON public.canvases 
FOR ALL 
USING (true)
WITH CHECK (true);