-- Add new fields to applications table for extended workflow tracking
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS nota_dinas_url TEXT,
ADD COLUMN IF NOT EXISTS nota_dinas_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS biro_osdma_status TEXT CHECK (biro_osdma_status IN ('submitted', 'in_progress', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS biro_osdma_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS biro_osdma_decision_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS biro_osdma_rejection_notes TEXT,
ADD COLUMN IF NOT EXISTS sk_url TEXT,
ADD COLUMN IF NOT EXISTS sk_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Add helpful comment
COMMENT ON COLUMN public.applications.nota_dinas_url IS 'URL for uploaded Nota Dinas to Biro OSDMA';
COMMENT ON COLUMN public.applications.biro_osdma_status IS 'Status of submission to Biro OSDMA: submitted, in_progress, approved, rejected';
COMMENT ON COLUMN public.applications.sk_url IS 'URL for uploaded SK (Surat Keputusan)';
