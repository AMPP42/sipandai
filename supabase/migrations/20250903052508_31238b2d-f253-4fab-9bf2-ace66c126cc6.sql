-- Create table for detailed document verification
CREATE TABLE public.document_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, needs_fix
  admin_notes TEXT,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin pusat can manage all document verifications"
ON public.document_verifications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin_pusat'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin_pusat'
  )
);

CREATE POLICY "Users can view verifications for their applications"
ON public.document_verifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = document_verifications.application_id 
    AND a.submitter_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_document_verifications_updated_at
BEFORE UPDATE ON public.document_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add detailed_verification_status to applications table
ALTER TABLE public.applications 
ADD COLUMN detailed_verification_status TEXT DEFAULT 'not_started'; -- not_started, in_progress, completed

-- Create function to update application detailed verification status
CREATE OR REPLACE FUNCTION public.update_application_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the application's detailed verification status based on document verifications
  UPDATE public.applications 
  SET detailed_verification_status = 
    CASE 
      WHEN NOT EXISTS (
        SELECT 1 FROM public.document_verifications 
        WHERE application_id = COALESCE(NEW.application_id, OLD.application_id)
      ) THEN 'not_started'
      WHEN EXISTS (
        SELECT 1 FROM public.document_verifications 
        WHERE application_id = COALESCE(NEW.application_id, OLD.application_id) 
        AND status = 'pending'
      ) THEN 'in_progress'
      ELSE 'completed'
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.application_id, OLD.application_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating application verification status
CREATE TRIGGER update_app_verification_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.document_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_application_verification_status();