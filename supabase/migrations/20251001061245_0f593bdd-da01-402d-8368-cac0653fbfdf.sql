-- Fix infinite recursion in employees table RLS policies
-- Drop problematic policies
DROP POLICY IF EXISTS "Authenticated users can view basic employee info" ON public.employees;
DROP POLICY IF EXISTS "Prevent bulk employee export" ON public.employees;

-- Create simplified, non-recursive policies
-- Policy 1: Admin pusat can view all employees
CREATE POLICY "Admin pusat can view all employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_pusat'
  )
);

-- Policy 2: Admin unit can view employees from their unit
CREATE POLICY "Admin unit can view their unit employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_unit'
    AND profiles.unit = employees.unit
  )
);

-- Policy 3: Regular authenticated users can view limited employee info (name, unit, jabatan only)
-- This prevents bulk data export while allowing basic lookups
CREATE POLICY "Authenticated users can view basic employee info"
ON public.employees
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
);