-- Fix Critical Security Issues: RLS Policies
-- This migration addresses 4 critical security vulnerabilities

-- ============================================================================
-- 1. FIX POSITIONS TABLE: Remove overly permissive public access
-- ============================================================================

-- Drop all overly permissive policies that allow public access
DROP POLICY IF EXISTS "Allow public read access to positions" ON public.positions;
DROP POLICY IF EXISTS "Allow authenticated users to read positions" ON public.positions;
DROP POLICY IF EXISTS "Allow authenticated users to insert positions" ON public.positions;
DROP POLICY IF EXISTS "Allow authenticated users to update positions" ON public.positions;
DROP POLICY IF EXISTS "Allow authenticated users to delete positions" ON public.positions;

-- Explicitly deny all anonymous access to positions
CREATE POLICY "Deny anonymous access to positions"
ON public.positions
FOR ALL
TO anon
USING (false);

-- Allow authenticated users to read positions
CREATE POLICY "Authenticated users can read positions"
ON public.positions
FOR SELECT
TO authenticated
USING (true);

-- Restrict write access to admin pusat only
CREATE POLICY "Admin pusat can modify positions"
ON public.positions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin_pusat'::app_role));

CREATE POLICY "Admin pusat can update positions"
ON public.positions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin_pusat'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin_pusat'::app_role));

CREATE POLICY "Admin pusat can delete positions"
ON public.positions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin_pusat'::app_role));

-- ============================================================================
-- 2. FIX EMPLOYEES TABLE: Add explicit denial for anonymous access
-- ============================================================================

-- Explicitly deny all anonymous access to employee PII
CREATE POLICY "Deny anonymous access to employees"
ON public.employees
FOR ALL
TO anon
USING (false);

-- ============================================================================
-- 3. FIX USULAN_MUTASI TABLE: Add explicit denial for anonymous access
-- ============================================================================

-- Explicitly deny all anonymous access to transfer proposals
CREATE POLICY "Deny anonymous access to usulan_mutasi"
ON public.usulan_mutasi
FOR ALL
TO anon
USING (false);

-- ============================================================================
-- 4. FIX CHAT_MESSAGES TABLE: Add explicit denial for anonymous access
-- ============================================================================

-- Explicitly deny all anonymous access to chat messages
CREATE POLICY "Deny anonymous access to chat_messages"
ON public.chat_messages
FOR ALL
TO anon
USING (false);

-- ============================================================================
-- Verification: Show updated policies
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('positions', 'employees', 'usulan_mutasi', 'chat_messages')
ORDER BY tablename, cmd, policyname;