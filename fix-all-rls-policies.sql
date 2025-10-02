-- Comprehensive RLS fix for all tables in Sipandai application
-- This script fixes RLS policies for: positions, applications, documents

-- ============================================================================
-- 1. FIX POSITIONS TABLE RLS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read positions" ON public.positions;
DROP POLICY IF EXISTS "Allow public read access to positions" ON public.positions;
DROP POLICY IF EXISTS "Allow authenticated users to update positions" ON public.positions;
DROP POLICY IF EXISTS "Allow authenticated users to delete positions" ON public.positions;
DROP POLICY IF EXISTS "Allow authenticated users to insert positions" ON public.positions;

-- SELECT policies
CREATE POLICY "Allow authenticated users to read positions"
ON public.positions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow public read access to positions"
ON public.positions FOR SELECT TO anon USING (true);

-- INSERT policy
CREATE POLICY "Allow authenticated users to insert positions"
ON public.positions FOR INSERT TO authenticated WITH CHECK (true);

-- UPDATE policy
CREATE POLICY "Allow authenticated users to update positions"
ON public.positions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- DELETE policy
CREATE POLICY "Allow authenticated users to delete positions"
ON public.positions FOR DELETE TO authenticated USING (true);

-- Enable RLS and grant permissions
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.positions TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.positions TO authenticated;

-- ============================================================================
-- 2. FIX APPLICATIONS TABLE RLS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read applications" ON public.applications;
DROP POLICY IF EXISTS "Allow authenticated users to insert applications" ON public.applications;
DROP POLICY IF EXISTS "Allow authenticated users to update applications" ON public.applications;
DROP POLICY IF EXISTS "Allow authenticated users to delete applications" ON public.applications;

-- SELECT policy
CREATE POLICY "Allow authenticated users to read applications"
ON public.applications FOR SELECT TO authenticated
USING (
    auth.uid() = submitter_id OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin_pusat', 'admin_unit')
    )
);

-- INSERT policy
CREATE POLICY "Allow authenticated users to insert applications"
ON public.applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = submitter_id);

-- UPDATE policy
CREATE POLICY "Allow authenticated users to update applications"
ON public.applications FOR UPDATE TO authenticated
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

-- DELETE policy
CREATE POLICY "Allow authenticated users to delete applications"
ON public.applications FOR DELETE TO authenticated
USING (auth.uid() = submitter_id AND status = 'draft');

-- Enable RLS and grant permissions
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;

-- ============================================================================
-- 3. FIX DOCUMENTS TABLE RLS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to insert documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to update documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users to delete documents" ON public.documents;

-- SELECT policy
CREATE POLICY "Allow authenticated users to read documents"
ON public.documents FOR SELECT TO authenticated
USING (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin_pusat'
    )
);

-- INSERT policy
CREATE POLICY "Allow authenticated users to insert documents"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- UPDATE policy
CREATE POLICY "Allow authenticated users to update documents"
ON public.documents FOR UPDATE TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- DELETE policy
CREATE POLICY "Allow authenticated users to delete documents"
ON public.documents FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- Enable RLS and grant permissions
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
    tablename,
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
WHERE tablename IN ('positions', 'applications', 'documents')
ORDER BY tablename, cmd, policyname;

-- Summary
SELECT 
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies 
WHERE tablename IN ('positions', 'applications', 'documents')
GROUP BY tablename
ORDER BY tablename;
