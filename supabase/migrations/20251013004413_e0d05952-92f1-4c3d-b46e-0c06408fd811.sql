-- Update the function to count all submitted applications (not drafts)
CREATE OR REPLACE FUNCTION public.get_public_statistics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_employees integer;
  total_applications integer;
  active_consultations integer;
BEGIN
  -- Count total employees
  SELECT COUNT(*) INTO total_employees FROM public.employees;
  
  -- Count all submitted applications (exclude drafts)
  SELECT COUNT(*) INTO total_applications 
  FROM public.applications 
  WHERE status != 'draft';
  
  -- Count active consultation tickets
  SELECT COUNT(*) INTO active_consultations 
  FROM public.consultation_tickets 
  WHERE status IN ('open', 'in_progress');
  
  -- Build result object
  result := jsonb_build_object(
    'totalEmployees', total_employees,
    'totalApplications', total_applications,
    'activeConsultations', active_consultations
  );
  
  RETURN result;
END;
$$;