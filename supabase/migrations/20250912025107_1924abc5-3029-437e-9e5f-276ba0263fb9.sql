-- Update RLS policies for employees table to properly restrict access by unit
DROP POLICY IF EXISTS "employees_select" ON public.employees;

-- Create new policy that allows admin_pusat to see all employees and admin_unit to see only their unit's employees
CREATE POLICY "employees_select_by_role" 
ON public.employees 
FOR SELECT 
USING (
  -- Admin pusat can see all employees
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin_pusat'
  ))
  OR
  -- Admin unit can only see employees from their unit
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin_unit'
    AND profiles.unit = employees.unit
  ))
);

-- Update RLS policies for positions table to properly restrict access by unit
DROP POLICY IF EXISTS "positions_select" ON public.positions;

-- Create new policy that allows admin_pusat to see all positions and admin_unit to see only their unit's positions
CREATE POLICY "positions_select_by_role" 
ON public.positions 
FOR SELECT 
USING (
  -- Admin pusat can see all positions
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin_pusat'
  ))
  OR
  -- Admin unit can only see positions from their unit
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin_unit'
    AND profiles.unit = positions.unit
  ))
);

-- Fix potential circular dependency in document_verifications policies by simplifying them
DROP POLICY IF EXISTS "Admin pusat can manage all document verifications" ON public.document_verifications;
DROP POLICY IF EXISTS "Users can view verifications for their applications" ON public.document_verifications;

-- Create simplified policies to avoid stack depth issues
CREATE POLICY "document_verifications_admin_all" 
ON public.document_verifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin_pusat'
  )
);

CREATE POLICY "document_verifications_user_select" 
ON public.document_verifications 
FOR SELECT 
USING (
  -- Users can view their own application verifications
  application_id IN (
    SELECT id FROM public.applications 
    WHERE submitter_id = auth.uid()
  )
);

-- Ensure admin_unit users can only access applications with employees from their unit
-- Update applications policies to include unit filtering for employee-related operations
DROP POLICY IF EXISTS "applications_select" ON public.applications;

CREATE POLICY "applications_select_by_role" 
ON public.applications 
FOR SELECT 
USING (
  -- Users can see their own applications
  (submitter_id = auth.uid()) 
  OR 
  -- Admin pusat can see all applications
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin_pusat'
  ))
  OR
  -- Admin unit can see applications from users in their unit
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin_unit'
    AND profiles.unit = applications.submitter_unit
  ))
);