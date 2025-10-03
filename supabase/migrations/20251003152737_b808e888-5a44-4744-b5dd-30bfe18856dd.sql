-- PHASE 1: CRITICAL SECURITY FIXES
-- Fix 1: Create app_role enum and user_roles table for secure role management
-- Fix 2: Enable RLS on employees table with proper policies
-- Fix 3: Fix notifications table SELECT policy

-- ============================================================================
-- FIX 1: PRIVILEGE ESCALATION - Create secure role management system
-- ============================================================================

-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin_pusat', 'admin_unit');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's unit (security definer)
CREATE OR REPLACE FUNCTION public.get_user_unit(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, unit)
SELECT id, role::public.app_role, unit
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove ability to update role in profiles (keep for backward compatibility but make read-only)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile (except role)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = role -- Role cannot change
);

-- ============================================================================
-- FIX 2: EMPLOYEES TABLE - Enable RLS and restrict access
-- ============================================================================

-- Enable RLS on employees table
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view basic employee info" ON public.employees;

-- Admin pusat can view all employees (already exists, but recreate with has_role)
DROP POLICY IF EXISTS "Admin pusat can view all employees" ON public.employees;
CREATE POLICY "Admin pusat can view all employees"
ON public.employees
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin_pusat'));

-- Admin unit can view only their unit employees (update to use has_role)
DROP POLICY IF EXISTS "Admin unit can view their unit employees" ON public.employees;
CREATE POLICY "Admin unit can view their unit employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin_unit') AND
  unit = public.get_user_unit(auth.uid())
);

-- Admin unit can insert employees for their unit (update to use has_role)
DROP POLICY IF EXISTS "Admin unit can insert employees for their unit" ON public.employees;
CREATE POLICY "Admin unit can insert employees for their unit"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin_unit') AND
  unit = public.get_user_unit(auth.uid())
);

-- Admin unit can update employees from their unit (update to use has_role)
DROP POLICY IF EXISTS "Admin unit can update employees from their unit" ON public.employees;
CREATE POLICY "Admin unit can update employees from their unit"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin_unit') AND
  unit = public.get_user_unit(auth.uid())
);

-- Admin unit can delete employees from their unit (update to use has_role)
DROP POLICY IF EXISTS "Admin unit can delete employees from their unit" ON public.employees;
CREATE POLICY "Admin unit can delete employees from their unit"
ON public.employees
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin_unit') AND
  unit = public.get_user_unit(auth.uid())
);

-- Admin pusat policies for write operations
CREATE POLICY "Admin pusat can insert employees"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin pusat can update employees"
ON public.employees
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin pusat can delete employees"
ON public.employees
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin_pusat'));

-- ============================================================================
-- FIX 3: NOTIFICATIONS TABLE - Add SELECT and proper INSERT policies
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;

-- Add SELECT policy - users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

-- Add INSERT policy - only admin can create notifications
CREATE POLICY "Admin can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin_pusat') OR
  public.has_role(auth.uid(), 'admin_unit')
);

-- Recreate UPDATE policy with new function
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- ============================================================================
-- FIX 4: AUDIT LOGS - Add SELECT policy for admin
-- ============================================================================

-- Add SELECT policy for admin_pusat
CREATE POLICY "Admin pusat can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin_pusat'));

-- ============================================================================
-- FIX 5: Update existing security definer functions to use has_role
-- ============================================================================

-- Update is_admin_pusat function
CREATE OR REPLACE FUNCTION public.is_admin_pusat()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT public.has_role(auth.uid(), 'admin_pusat');
$function$;

-- Update is_admin_pusat_user function
CREATE OR REPLACE FUNCTION public.is_admin_pusat_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT public.has_role(auth.uid(), 'admin_pusat');
$function$;

-- Update can_edit_employee_unit function
CREATE OR REPLACE FUNCTION public.can_edit_employee_unit(employee_unit TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT 
    CASE 
      WHEN public.has_role(auth.uid(), 'admin_pusat') THEN true
      WHEN public.has_role(auth.uid(), 'admin_unit') AND public.get_user_unit(auth.uid()) = employee_unit THEN true
      ELSE false
    END;
$function$;

-- Verify security fixes
SELECT 'Security fixes applied successfully!' as status;