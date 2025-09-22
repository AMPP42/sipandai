-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', false);

-- Create storage policies for chat files
CREATE POLICY "Users can view their own chat files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'chat-files' AND
  EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    JOIN public.chat_messages cm ON cm.session_id = cs.id
    WHERE (cs.user_id = auth.uid() OR cs.officer_id = auth.uid())
    AND cm.file_url LIKE '%' || name || '%'
  )
);

CREATE POLICY "Users can upload files to their chat sessions" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own chat files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own chat files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);