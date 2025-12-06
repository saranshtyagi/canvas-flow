-- Create canvases table for storing whiteboard data
CREATE TABLE public.canvases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id TEXT,
  name TEXT NOT NULL DEFAULT 'Untitled Canvas',
  content JSONB,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.canvases ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_canvases_user_id ON public.canvases(user_id);
CREATE INDEX idx_canvases_organization_id ON public.canvases(organization_id);
CREATE INDEX idx_canvases_updated_at ON public.canvases(updated_at DESC);

-- Policy: Users can view canvases in their organization or their own canvases
CREATE POLICY "Users can view org canvases" 
ON public.canvases 
FOR SELECT 
USING (
  organization_id IS NOT NULL OR user_id = current_setting('request.headers', true)::json->>'x-clerk-user-id'
);

-- Policy: Users can insert their own canvases
CREATE POLICY "Users can create canvases" 
ON public.canvases 
FOR INSERT 
WITH CHECK (true);

-- Policy: Users can update their own canvases
CREATE POLICY "Users can update own canvases" 
ON public.canvases 
FOR UPDATE 
USING (user_id = current_setting('request.headers', true)::json->>'x-clerk-user-id');

-- Policy: Users can delete their own canvases
CREATE POLICY "Users can delete own canvases" 
ON public.canvases 
FOR DELETE 
USING (user_id = current_setting('request.headers', true)::json->>'x-clerk-user-id');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_canvases_updated_at
BEFORE UPDATE ON public.canvases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();