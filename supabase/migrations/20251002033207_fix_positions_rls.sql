-- Fix RLS policy for positions table to allow public access
-- This will allow the Pengajuan Mutasi Terpadu app to access positions data

-- First, let's check what data exists in positions table
DO $$
BEGIN
  RAISE NOTICE 'Checking current positions data...';
END $$;

-- Drop existing restrictive RLS policies
DROP POLICY IF EXISTS "positions_select_by_role" ON public.positions;
DROP POLICY IF EXISTS "positions_select" ON public.positions;

-- Create new policy that allows public access to positions data
CREATE POLICY "positions_select_public" 
ON public.positions 
FOR SELECT 
USING (true);

-- Also allow public access for INSERT, UPDATE, DELETE for admin functionality
CREATE POLICY "positions_insert_public" 
ON public.positions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "positions_update_public" 
ON public.positions 
FOR UPDATE 
USING (true);

CREATE POLICY "positions_delete_public" 
ON public.positions 
FOR DELETE 
USING (true);

-- Ensure RLS is enabled on the table
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'RLS policies updated for positions table';
  RAISE NOTICE 'Public access granted for SELECT, INSERT, UPDATE, DELETE operations';
END $$;
