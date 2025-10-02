-- Fix the update_application_verification_status function to properly update application status
DROP FUNCTION IF EXISTS public.update_application_verification_status() CASCADE;
CREATE OR REPLACE FUNCTION public.update_application_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update the detailed_verification_status field
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
    -- Also update the main status field when all documents are verified
    status = CASE
      -- If all documents are verified and none need fixing, mark as approved
      WHEN NOT EXISTS (
        SELECT 1 FROM public.document_verifications 
        WHERE application_id = COALESCE(NEW.application_id, OLD.application_id) 
        AND status = 'pending'
      ) AND NOT EXISTS (
        SELECT 1 FROM public.document_verifications 
        WHERE application_id = COALESCE(NEW.application_id, OLD.application_id) 
        AND status = 'needs_fix'
      ) THEN 'approved'
      -- If all documents are verified but some need fixing, mark as revision_needed
      WHEN NOT EXISTS (
        SELECT 1 FROM public.document_verifications 
        WHERE application_id = COALESCE(NEW.application_id, OLD.application_id) 
        AND status = 'pending'
      ) AND EXISTS (
        SELECT 1 FROM public.document_verifications 
        WHERE application_id = COALESCE(NEW.application_id, OLD.application_id) 
        AND status = 'needs_fix'
      ) THEN 'revision_needed'
      -- Otherwise keep the current status
      ELSE (SELECT status FROM public.applications WHERE id = COALESCE(NEW.application_id, OLD.application_id))
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.application_id, OLD.application_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for document_verifications table
DROP TRIGGER IF EXISTS update_application_status_on_verification ON public.document_verifications;
CREATE TRIGGER update_application_status_on_verification
AFTER INSERT OR UPDATE OR DELETE ON public.document_verifications
FOR EACH ROW EXECUTE FUNCTION public.update_application_verification_status();

-- Fix the RevisionSubmissionModal to properly update status for all application types
CREATE OR REPLACE FUNCTION public.submit_application_revision(application_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update application status to submitted for re-verification
  UPDATE public.applications
  SET 
    status = 'submitted',
    updated_at = now()
  WHERE id = application_id;
  
  -- Log workflow change
  INSERT INTO public.workflows (
    application_id,
    from_status,
    to_status,
    actor_id,
    note
  ) VALUES (
    application_id,
    'revision_needed',
    'submitted',
    auth.uid(),
    'Perbaikan diajukan ulang untuk verifikasi'
  );
END;
$$;