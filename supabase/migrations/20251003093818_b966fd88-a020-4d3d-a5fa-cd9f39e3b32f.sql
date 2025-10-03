-- Add file_link column to workflows table to store supporting document links
ALTER TABLE public.workflows 
ADD COLUMN file_link TEXT;

COMMENT ON COLUMN public.workflows.file_link IS 'Link to supporting documents (Google Drive, etc.) for timeline status updates';