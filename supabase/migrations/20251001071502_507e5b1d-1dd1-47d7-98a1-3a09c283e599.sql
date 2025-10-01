-- Add RLS policies for admin_pusat to manage FAQ items
-- Admin pusat can insert FAQ items
CREATE POLICY "Admin pusat can insert FAQ items"
ON public.faq_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_pusat'
  )
);

-- Admin pusat can update FAQ items
CREATE POLICY "Admin pusat can update FAQ items"
ON public.faq_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_pusat'
  )
);

-- Admin pusat can delete FAQ items
CREATE POLICY "Admin pusat can delete FAQ items"
ON public.faq_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_pusat'
  )
);

-- Admin pusat can view all FAQ items (including inactive ones)
CREATE POLICY "Admin pusat can view all FAQ items"
ON public.faq_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin_pusat'
  )
);