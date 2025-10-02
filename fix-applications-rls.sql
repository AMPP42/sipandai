-- Fix RLS policies for applications table
-- This is needed for submitting mutasi terpadu applications

-- Check current policies on applications table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY cmd, policyname;

-- Drop existing policies if any (to start fresh)
DROP POLICY IF EXISTS "Allow authenticated users to read applications" ON public.applications;
DROP POLICY IF EXISTS "Allow authenticated users to insert applications" ON public.applications;
DROP POLICY IF EXISTS "Allow authenticated users to update applications" ON public.applications;
DROP POLICY IF EXISTS "Allow authenticated users to delete applications" ON public.applications;

-- Create comprehensive policies for applications table

-- SELECT policy - allow users to read their own applications or if they are admin
CREATE POLICY "Allow authenticated users to read applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
    auth.uid() = submitter_id OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin_pusat', 'admin_unit')
    )
);

-- INSERT policy - allow authenticated users to insert applications
CREATE POLICY "Allow authenticated users to insert applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = submitter_id
);

-- UPDATE policy - allow users to update their own applications or if they are admin
CREATE POLICY "Allow authenticated users to update applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (
    auth.uid() = submitter_id OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin_pusat', 'admin_unit')
    )
)
WITH CHECK (
    auth.uid() = submitter_id OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin_pusat', 'admin_unit')
    )
);

-- DELETE policy - allow users to delete their own draft applications
CREATE POLICY "Allow authenticated users to delete applications"
ON public.applications
FOR DELETE
TO authenticated
USING (
    auth.uid() = submitter_id AND status = 'draft'
);

-- Ensure RLS is enabled
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;

-- Verify the new policies
SELECT 
    policyname,
    cmd,
    roles,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Read'
        WHEN cmd = 'INSERT' THEN 'Create'
        WHEN cmd = 'UPDATE' THEN 'Update'
        WHEN cmd = 'DELETE' THEN 'Delete'
    END as operation
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY cmd, policyname;
