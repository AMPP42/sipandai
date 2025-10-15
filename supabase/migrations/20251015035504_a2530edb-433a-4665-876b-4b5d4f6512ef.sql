-- Create user registration requests table for approval workflow
CREATE TABLE IF NOT EXISTS public.user_registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  requested_role app_role NOT NULL,
  requested_unit TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role change history table
CREATE TABLE IF NOT EXISTS public.user_role_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  old_role app_role,
  new_role app_role NOT NULL,
  old_unit TEXT,
  new_unit TEXT,
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  change_reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_registration_requests
CREATE POLICY "Admin pusat can view all registration requests"
  ON public.user_registration_requests FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin pusat can update registration requests"
  ON public.user_registration_requests FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'))
  WITH CHECK (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Anyone can create registration request"
  ON public.user_registration_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for user_role_history
CREATE POLICY "Admin pusat can view all role history"
  ON public.user_role_history FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin pusat can insert role history"
  ON public.user_role_history FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Users can view their own role history"
  ON public.user_role_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if role or unit actually changed
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.unit IS DISTINCT FROM NEW.unit) THEN
    INSERT INTO public.user_role_history (
      user_id,
      old_role,
      new_role,
      old_unit,
      new_unit,
      changed_by
    ) VALUES (
      NEW.user_id,
      OLD.role,
      NEW.role,
      OLD.unit,
      NEW.unit,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for role changes
DROP TRIGGER IF EXISTS log_user_role_changes ON public.user_roles;
CREATE TRIGGER log_user_role_changes
  AFTER UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();

-- Function to approve user registration
CREATE OR REPLACE FUNCTION public.approve_user_registration(
  request_id UUID,
  admin_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
  new_user_id UUID;
BEGIN
  -- Check if caller is admin_pusat
  IF NOT has_role(admin_user_id, 'admin_pusat') THEN
    RAISE EXCEPTION 'Only admin pusat can approve registrations';
  END IF;

  -- Get registration request
  SELECT * INTO req FROM public.user_registration_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration request not found or already processed';
  END IF;

  -- Generate user ID
  new_user_id := gen_random_uuid();

  -- Create profile
  INSERT INTO public.profiles (id, name, role, unit)
  VALUES (new_user_id, req.name, req.requested_role::TEXT, req.requested_unit);

  -- Create role
  INSERT INTO public.user_roles (user_id, role, unit)
  VALUES (new_user_id, req.requested_role, req.requested_unit);

  -- Update request status
  UPDATE public.user_registration_requests
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = admin_user_id,
      updated_at = now()
  WHERE id = request_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', req.email
  );
END;
$$;

-- Function to reject user registration
CREATE OR REPLACE FUNCTION public.reject_user_registration(
  request_id UUID,
  admin_user_id UUID,
  reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin_pusat
  IF NOT has_role(admin_user_id, 'admin_pusat') THEN
    RAISE EXCEPTION 'Only admin pusat can reject registrations';
  END IF;

  -- Update request status
  UPDATE public.user_registration_requests
  SET status = 'rejected',
      reviewed_at = now(),
      reviewed_by = admin_user_id,
      rejection_reason = reason,
      updated_at = now()
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration request not found or already processed';
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_registration_requests_status ON public.user_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_registration_requests_email ON public.user_registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_user_role_history_user_id ON public.user_role_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_history_changed_at ON public.user_role_history(changed_at DESC);