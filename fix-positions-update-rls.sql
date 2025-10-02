-- Add RLS policies for UPDATE and DELETE operations on positions table
-- Currently only SELECT policies exist, so UPDATE/DELETE are blocked

-- Check current policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'positions'
ORDER BY cmd, policyname;

-- Drop existing update/delete policies if any (to start fresh)
DROP POLICY IF EXISTS "Allow authenticated users to update positions" ON public.positions;
DROP POLICY IF EXISTS "Allow admin to update positions" ON public.positions;
DROP POLICY IF EXISTS "Allow authenticated users to delete positions" ON public.positions;
DROP POLICY IF EXISTS "Allow admin to delete positions" ON public.positions;

-- Create policy for UPDATE - allow authenticated users to update positions
CREATE POLICY "Allow authenticated users to update positions"
ON public.positions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for DELETE - allow authenticated users to delete positions
CREATE POLICY "Allow authenticated users to delete positions"
ON public.positions
FOR DELETE
TO authenticated
USING (true);

-- Create policy for INSERT - allow authenticated users to insert positions
DROP POLICY IF EXISTS "Allow authenticated users to insert positions" ON public.positions;
CREATE POLICY "Allow authenticated users to insert positions"
ON public.positions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant necessary permissions
GRANT UPDATE ON public.positions TO authenticated;
GRANT DELETE ON public.positions TO authenticated;
GRANT INSERT ON public.positions TO authenticated;

-- Verify all policies
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
WHERE tablename = 'positions'
ORDER BY cmd, policyname;
