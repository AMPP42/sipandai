-- Fix RLS policy for document_verifications to allow admin_unit to access
-- Drop the existing problematic policy
DROP POLICY IF EXISTS "document_verifications_admin_all" ON public.document_verifications;

-- Create separate policies for admin_pusat and admin_unit
CREATE POLICY "document_verifications_admin_pusat_all"
ON public.document_verifications
FOR ALL
TO authenticated
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

-- Allow admin_unit to SELECT and UPDATE document verifications for their unit's applications
CREATE POLICY "document_verifications_admin_unit_access"
ON public.document_verifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.applications a ON a.id = document_verifications.application_id
    WHERE p.id = auth.uid() 
    AND p.role = 'admin_unit'
    AND p.unit = a.submitter_unit
  )
);

-- Allow admin_unit to INSERT document verifications for their unit's applications
CREATE POLICY "document_verifications_admin_unit_insert"
ON public.document_verifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.applications a ON a.id = document_verifications.application_id
    WHERE p.id = auth.uid() 
    AND p.role = 'admin_unit'
    AND p.unit = a.submitter_unit
  )
);

-- Allow admin_unit to UPDATE document verifications for their unit's applications  
CREATE POLICY "document_verifications_admin_unit_update"
ON public.document_verifications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.applications a ON a.id = document_verifications.application_id
    WHERE p.id = auth.uid() 
    AND p.role = 'admin_unit'
    AND p.unit = a.submitter_unit
  )
);