-- Add missing UPDATE policy for property_documents table
CREATE POLICY "Users can update their own property documents"
ON public.property_documents FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);