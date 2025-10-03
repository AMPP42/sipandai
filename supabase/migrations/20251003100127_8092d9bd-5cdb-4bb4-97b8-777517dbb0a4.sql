-- Update RLS policies for applications table to allow admin_unit to delete applications from their unit
DROP POLICY IF EXISTS "Allow authenticated users to delete applications" ON public.applications;

CREATE POLICY "Admin pusat can delete all applications"
ON public.applications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin_pusat'
  )
);

CREATE POLICY "Admin unit can delete applications from their unit"
ON public.applications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'admin_unit'
    AND unit = applications.submitter_unit
  )
);

CREATE POLICY "Users can delete their own draft applications"
ON public.applications
FOR DELETE
TO authenticated
USING (
  auth.uid() = submitter_id 
  AND status = 'draft'
);

-- Update RLS policies for usulan_mutasi table
DROP POLICY IF EXISTS "Admin pusat can delete proposals" ON public.usulan_mutasi;
DROP POLICY IF EXISTS "Admin unit can delete proposals" ON public.usulan_mutasi;

CREATE POLICY "Admin pusat can delete all proposals"
ON public.usulan_mutasi
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin_pusat'
  )
);

-- Update RLS policies for dokumen_usulan table
DROP POLICY IF EXISTS "Admin pusat can delete documents" ON public.dokumen_usulan;

CREATE POLICY "Admin pusat can delete all documents"
ON public.dokumen_usulan
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin_pusat'
  )
);

-- Update RLS policies for document_verifications table
DROP POLICY IF EXISTS "Admin pusat can delete verifications" ON public.document_verifications;

CREATE POLICY "Admin pusat can delete all document verifications"
ON public.document_verifications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin_pusat'
  )
);

-- Update RLS policies for workflows table
DROP POLICY IF EXISTS "Admin pusat can delete workflows" ON public.workflows;

CREATE POLICY "Admin pusat can delete all workflows"
ON public.workflows
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin_pusat'
  )
);