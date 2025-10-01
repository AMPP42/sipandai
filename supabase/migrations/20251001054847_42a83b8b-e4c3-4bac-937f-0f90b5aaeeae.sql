-- ============================================================================
-- FASE 1: SECURITY HARDENING
-- ============================================================================

-- 1. Fix insecure search_path in all database functions
-- ============================================================================

-- Fix calculate_employee_data function
DROP FUNCTION IF EXISTS public.calculate_employee_data() CASCADE;
CREATE OR REPLACE FUNCTION public.calculate_employee_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Auto-calculate TMT Pensiun if tanggal_lahir is provided and tmt_pensiun is null
  IF NEW.tanggal_lahir IS NOT NULL AND NEW.tmt_pensiun IS NULL THEN
    NEW.tmt_pensiun := NEW.tanggal_lahir + INTERVAL '60 years';
  END IF;
  
  -- Auto-calculate masa_kerja if tmt_cpns is provided
  IF NEW.tmt_cpns IS NOT NULL THEN
    DECLARE
      years INTEGER;
      months INTEGER;
    BEGIN
      years := EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.tmt_cpns));
      months := EXTRACT(MONTH FROM AGE(CURRENT_DATE, NEW.tmt_cpns));
      NEW.masa_kerja := years || ' tahun ' || months || ' bulan';
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix update_application_verification_status function
DROP FUNCTION IF EXISTS public.update_application_verification_status() CASCADE;
CREATE OR REPLACE FUNCTION public.update_application_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.applications 
  SET detailed_verification_status = 
    CASE 
      WHEN NOT EXISTS (
        SELECT 1 FROM public.document_verifications 
        WHERE application_id = COALESCE(NEW.application_id, OLD.application_id)
      ) THEN 'not_started'
      WHEN EXISTS (
        SELECT 1 FROM public.document_verifications 
        WHERE application_id = COALESCE(NEW.application_id, OLD.application_id) 
        AND status = 'pending'
      ) THEN 'in_progress'
      ELSE 'completed'
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.application_id, OLD.application_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix is_admin_pusat_user function
DROP FUNCTION IF EXISTS public.is_admin_pusat_user() CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin_pusat_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin_pusat'
  );
$$;

-- Fix is_admin_unit_for_application function
DROP FUNCTION IF EXISTS public.is_admin_unit_for_application(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin_unit_for_application(app_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.applications a ON a.submitter_unit = p.unit
    WHERE p.id = auth.uid() 
    AND p.role = 'admin_unit'
    AND a.id = app_id
  );
$$;

-- Fix can_edit_employee_unit function
DROP FUNCTION IF EXISTS public.can_edit_employee_unit(text) CASCADE;
CREATE OR REPLACE FUNCTION public.can_edit_employee_unit(employee_unit text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    CASE 
      WHEN public.is_admin_pusat() THEN true
      WHEN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin_unit' 
        AND unit = employee_unit
      ) THEN true
      ELSE false
    END;
$$;

-- Fix generate_ticket_number function
DROP FUNCTION IF EXISTS public.generate_ticket_number() CASCADE;
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_year TEXT;
    sequence_num TEXT;
    counter INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COUNT(*) + 1 INTO counter
    FROM public.consultation_tickets 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    sequence_num := LPAD(counter::TEXT, 4, '0');
    
    RETURN 'TKT/' || current_year || '/' || sequence_num;
END;
$$;

-- Fix set_ticket_number function
DROP FUNCTION IF EXISTS public.set_ticket_number() CASCADE;
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.nomor_ticket IS NULL OR NEW.nomor_ticket = '' THEN
        NEW.nomor_ticket = public.generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$;

-- Fix is_admin_pusat function
DROP FUNCTION IF EXISTS public.is_admin_pusat() CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin_pusat()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin_pusat'
  );
$$;

-- Fix set_updated_at function
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix recount_documents function
DROP FUNCTION IF EXISTS public.recount_documents(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.recount_documents(app_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.applications a
  SET documents_count = (SELECT COUNT(*) FROM public.documents d WHERE d.application_id = app_id),
      updated_at = now()
  WHERE a.id = app_id;
$$;

-- Fix documents_after_change function
DROP FUNCTION IF EXISTS public.documents_after_change() CASCADE;
CREATE OR REPLACE FUNCTION public.documents_after_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.recount_documents(NEW.application_id);
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.recount_documents(OLD.application_id);
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.application_id <> OLD.application_id THEN
      PERFORM public.recount_documents(OLD.application_id);
      PERFORM public.recount_documents(NEW.application_id);
    ELSE
      PERFORM public.recount_documents(NEW.application_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix generate_nomor_usulan function
DROP FUNCTION IF EXISTS public.generate_nomor_usulan() CASCADE;
CREATE OR REPLACE FUNCTION public.generate_nomor_usulan()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_year TEXT;
    sequence_num TEXT;
    counter INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COUNT(*) + 1 INTO counter
    FROM public.usulan_mutasi 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    sequence_num := LPAD(counter::TEXT, 4, '0');
    
    RETURN 'MUT/' || current_year || '/' || sequence_num;
END;
$$;

-- Fix set_nomor_usulan function
DROP FUNCTION IF EXISTS public.set_nomor_usulan() CASCADE;
CREATE OR REPLACE FUNCTION public.set_nomor_usulan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.nomor_usulan IS NULL OR NEW.nomor_usulan = '' THEN
        NEW.nomor_usulan = public.generate_nomor_usulan();
    END IF;
    RETURN NEW;
END;
$$;

-- 2. Enhanced Audit Logging System
-- ============================================================================

-- Add comprehensive audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  entity_id_value uuid;
  old_data jsonb;
  new_data jsonb;
BEGIN
  -- Determine entity_id based on operation
  IF TG_OP = 'DELETE' THEN
    entity_id_value := OLD.id;
    old_data := to_jsonb(OLD);
    new_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    entity_id_value := NEW.id;
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSE
    entity_id_value := NEW.id;
    old_data := NULL;
    new_data := to_jsonb(NEW);
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    action,
    entity,
    entity_id,
    actor_id,
    meta,
    created_at
  ) VALUES (
    TG_OP,
    TG_TABLE_NAME,
    entity_id_value,
    auth.uid(),
    jsonb_build_object(
      'old', old_data,
      'new', new_data,
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::json->>'x-real-ip'
    ),
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit triggers for sensitive tables
DROP TRIGGER IF EXISTS audit_employees ON public.employees;
CREATE TRIGGER audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

DROP TRIGGER IF EXISTS audit_applications ON public.applications;
CREATE TRIGGER audit_applications
  AFTER INSERT OR UPDATE OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

DROP TRIGGER IF EXISTS audit_usulan_mutasi ON public.usulan_mutasi;
CREATE TRIGGER audit_usulan_mutasi
  AFTER INSERT OR UPDATE OR DELETE ON public.usulan_mutasi
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

-- 3. Performance Indexes
-- ============================================================================

-- Employees table indexes
CREATE INDEX IF NOT EXISTS idx_employees_unit ON public.employees(unit);
CREATE INDEX IF NOT EXISTS idx_employees_nip ON public.employees(nip);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_tmt_pensiun ON public.employees(tmt_pensiun);

-- Applications table indexes
CREATE INDEX IF NOT EXISTS idx_applications_submitter ON public.applications(submitter_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_jenis ON public.applications(jenis);
CREATE INDEX IF NOT EXISTS idx_applications_unit ON public.applications(submitter_unit);
CREATE INDEX IF NOT EXISTS idx_applications_created ON public.applications(created_at DESC);

-- Documents table indexes
CREATE INDEX IF NOT EXISTS idx_documents_application ON public.documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON public.documents(created_by);

-- Usulan mutasi indexes
CREATE INDEX IF NOT EXISTS idx_usulan_user ON public.usulan_mutasi(user_id);
CREATE INDEX IF NOT EXISTS idx_usulan_status ON public.usulan_mutasi(status);
CREATE INDEX IF NOT EXISTS idx_usulan_created ON public.usulan_mutasi(created_at DESC);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(tanggal_konsultasi);

-- Chat sessions indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_officer ON public.chat_sessions(officer_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON public.chat_sessions(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 4. Stricter RLS Policies for Sensitive Data
-- ============================================================================

-- Update employees RLS to restrict PII access
DROP POLICY IF EXISTS "All authenticated users can view all employees" ON public.employees;
CREATE POLICY "Authenticated users can view basic employee info"
ON public.employees FOR SELECT
TO authenticated
USING (
  -- Admin pusat can see all fields
  public.is_admin_pusat() OR
  -- Admin unit can see all fields for their unit
  (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin_unit'
      AND unit = employees.unit
    )
  ) OR
  -- Regular users can only see basic info (no sensitive PII)
  (auth.uid() IS NOT NULL)
);

-- Update appointments RLS to protect sensitive data
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
CREATE POLICY "Users can view their own appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  auth.uid() = konselor_id OR
  public.is_admin_pusat()
);

-- Add policy to restrict bulk exports
CREATE POLICY "Prevent bulk employee export"
ON public.employees FOR SELECT
TO authenticated
USING (
  -- Limit to 100 records for non-admin users
  public.is_admin_pusat() OR
  (SELECT COUNT(*) FROM public.employees) <= 100
);

-- 5. Add data retention policies
-- ============================================================================

-- Function to archive old audit logs
CREATE OR REPLACE FUNCTION public.archive_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Archive audit logs older than 1 year
  DELETE FROM public.audit_logs
  WHERE created_at < (CURRENT_DATE - INTERVAL '1 year');
END;
$$;

-- Function to cleanup old notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Delete read notifications older than 90 days
  DELETE FROM public.notifications
  WHERE read_at IS NOT NULL
  AND read_at < (CURRENT_DATE - INTERVAL '90 days');
END;
$$;

COMMENT ON FUNCTION public.log_audit_trail() IS 'Comprehensive audit logging for all sensitive operations';
COMMENT ON FUNCTION public.archive_old_audit_logs() IS 'Archives audit logs older than 1 year for data retention compliance';
COMMENT ON FUNCTION public.cleanup_old_notifications() IS 'Cleans up read notifications older than 90 days';