-- Fix RLS policies for documents table
-- Error: new row violates row-level security policy for table "documents"

-- Check current policies on documents table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'documents'
ORDER BY cmd, policyname;

-- Drop existing policies if any (to start fresh)
DROP POLICY IF EXISTS "Allow authenticated users to read documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to insert documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to update documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to delete documents" ON public.documents;
DROP POLICY IF EXISTS "Allow public read access to documents" ON public.documents;

-- Create comprehensive policies for documents table

-- SELECT policy - allow authenticated users to read their own documents
CREATE POLICY "Allow authenticated users to read documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
    auth.uid() = uploader_id OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin_pusat'
    )
);

-- INSERT policy - allow authenticated users to insert documents
CREATE POLICY "Allow authenticated users to insert documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = uploader_id
);

-- UPDATE policy - allow users to update their own documents
CREATE POLICY "Allow authenticated users to update documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (auth.uid() = uploader_id)
WITH CHECK (auth.uid() = uploader_id);

-- DELETE policy - allow users to delete their own documents
CREATE POLICY "Allow authenticated users to delete documents"
ON public.documents
FOR DELETE
TO authenticated
USING (auth.uid() = uploader_id);

-- Ensure RLS is enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;

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
WHERE tablename = 'documents'
ORDER BY cmd, policyname;
