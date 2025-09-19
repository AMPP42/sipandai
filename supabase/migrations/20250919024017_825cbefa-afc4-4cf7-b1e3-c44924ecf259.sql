-- Create security definer functions to avoid RLS recursion issues
-- Function to check if current user is admin_pusat
CREATE OR REPLACE FUNCTION public.is_admin_pusat_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin_pusat'
  );
$$;

-- Function to check if current user is admin_unit for a specific application
CREATE OR REPLACE FUNCTION public.is_admin_unit_for_application(app_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.applications a ON a.submitter_unit = p.unit
    WHERE p.id = auth.uid() 
    AND p.role = 'admin_unit'
    AND a.id = app_id
  );
$$;

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "document_verifications_admin_pusat_all" ON public.document_verifications;
DROP POLICY IF EXISTS "document_verifications_admin_unit_access" ON public.document_verifications;
DROP POLICY IF EXISTS "document_verifications_admin_unit_insert" ON public.document_verifications;
DROP POLICY IF EXISTS "document_verifications_admin_unit_update" ON public.document_verifications;
DROP POLICY IF EXISTS "document_verifications_user_select" ON public.document_verifications;

-- Create new simplified policies using security definer functions
CREATE POLICY "document_verifications_admin_pusat_full_access"
ON public.document_verifications
FOR ALL
TO authenticated
USING (public.is_admin_pusat_user())
WITH CHECK (public.is_admin_pusat_user());

CREATE POLICY "document_verifications_admin_unit_select"
ON public.document_verifications
FOR SELECT
TO authenticated
USING (public.is_admin_unit_for_application(application_id));

CREATE POLICY "document_verifications_admin_unit_modify"
ON public.document_verifications
FOR ALL
TO authenticated
USING (public.is_admin_unit_for_application(application_id))
WITH CHECK (public.is_admin_unit_for_application(application_id));

CREATE POLICY "document_verifications_user_view"
ON public.document_verifications
FOR SELECT
TO authenticated
USING (
  application_id IN (
    SELECT id FROM public.applications 
    WHERE submitter_id = auth.uid()
  )
);