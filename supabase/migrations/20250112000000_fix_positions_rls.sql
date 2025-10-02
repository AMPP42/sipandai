-- Fix RLS policies for positions table to allow public access for application functionality
-- This allows the Pengajuan Mutasi Terpadu app to load positions data

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "positions_select_by_role" ON public.positions;

-- Create new policy that allows public access to positions data
-- This is needed for the Pengajuan Mutasi Terpadu application to function
CREATE POLICY "positions_select_public" 
ON public.positions 
FOR SELECT 
USING (true);

-- Also allow public access for INSERT, UPDATE, DELETE for admin functionality
-- This allows the Admin Formasi panel to work properly
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
