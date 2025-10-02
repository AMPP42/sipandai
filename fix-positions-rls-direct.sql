-- Fix RLS policy for positions table to allow public access
-- This will allow the Pengajuan Mutasi Terpadu app to access positions data

-- First, let's check what data exists in positions table
SELECT 'Current positions data:' as info;
SELECT COUNT(*) as total_positions FROM public.positions;

-- Show sample data
SELECT 'Sample positions:' as info;
SELECT unit, jabatan, existing, kebutuhan, gap 
FROM public.positions 
LIMIT 10;

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

-- Test the access
SELECT 'After RLS fix - testing access:' as info;
SELECT COUNT(*) as accessible_positions FROM public.positions;

-- Show positions for target unit
SELECT 'Positions for Sekretariat Direktorat Jenderal:' as info;
SELECT unit, jabatan, existing, kebutuhan, gap 
FROM public.positions 
WHERE unit ILIKE '%Sekretariat Direktorat Jenderal%'
ORDER BY jabatan;
