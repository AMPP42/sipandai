-- Update the document_verifications table to link with actual documents
ALTER TABLE public.document_verifications 
ADD COLUMN document_id UUID REFERENCES public.documents(id),
ADD COLUMN document_link TEXT;

-- Update the documents table to store more metadata for categorization
ALTER TABLE public.documents 
ADD COLUMN document_category TEXT,
ADD COLUMN document_index INTEGER;