-- Fix RLS policies for positions table to allow read access
-- This will allow authenticated users to read positions data

-- First, check if RLS is enabled
-- If you want to see current policies, run: 
-- SELECT * FROM pg_policies WHERE tablename = 'positions';

-- Drop existing policies if any (to start fresh)
DROP POLICY IF EXISTS "Allow authenticated users to read positions" ON public.positions;
DROP POLICY IF EXISTS "Allow public read access to positions" ON public.positions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.positions;

-- Create a new policy that allows all authenticated users to read positions
CREATE POLICY "Allow authenticated users to read positions"
ON public.positions
FOR SELECT
TO authenticated
USING (true);

-- Also allow public (anon) users to read positions
-- This is needed for the form to load positions before user logs in
CREATE POLICY "Allow public read access to positions"
ON public.positions
FOR SELECT
TO anon
USING (true);

-- Verify RLS is enabled (it should be)
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON public.positions TO authenticated;
GRANT SELECT ON public.positions TO anon;

-- Show the new policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'positions'
ORDER BY policyname;
