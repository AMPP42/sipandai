-- Create a function to get public statistics for the landing page
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
  
  -- Count applications in process (submitted, in_review, approved)
  SELECT COUNT(*) INTO total_applications 
  FROM public.applications 
  WHERE status IN ('submitted', 'approved', 'revision_needed');
  
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