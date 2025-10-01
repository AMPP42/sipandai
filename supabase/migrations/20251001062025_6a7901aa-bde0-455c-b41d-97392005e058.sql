-- Fix RLS policies for consultation_tickets to allow users to view their own tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.consultation_tickets;

CREATE POLICY "Users can view their own tickets"
ON public.consultation_tickets
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add policy for admin_pusat to view all tickets
CREATE POLICY "Admin pusat can view all tickets"
ON public.consultation_tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_pusat'
  )
);

-- Add policy for admin_pusat to update tickets
CREATE POLICY "Admin pusat can update tickets"
ON public.consultation_tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_pusat'
  )
);

-- Fix RLS policies for appointments to allow users to view their own appointments
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;

CREATE POLICY "Users can view their own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add policy for admin_pusat to manage all appointments
CREATE POLICY "Admin pusat can view all appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_pusat'
  )
);

CREATE POLICY "Admin pusat can update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_pusat'
  )
);