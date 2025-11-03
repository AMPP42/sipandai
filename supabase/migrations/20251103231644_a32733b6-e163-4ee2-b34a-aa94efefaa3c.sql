-- Create application types enum
CREATE TYPE public.application_type AS ENUM ('mutasi', 'kenaikan_pangkat', 'pensiun');

-- Create application status enum
CREATE TYPE public.application_status AS ENUM (
  'draft',              -- User sedang menyusun
  'submitted',          -- User sudah submit
  'admin_unit_review',  -- Dalam review Admin Unit
  'admin_unit_rejected',-- Ditolak Admin Unit
  'admin_unit_approved',-- Disetujui Admin Unit, menunggu Admin Pusat
  'admin_pusat_review', -- Dalam review Admin Pusat
  'admin_pusat_rejected',-- Ditolak Admin Pusat
  'approved',           -- Disetujui Admin Pusat
  'completed'           -- Selesai
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_unit_id UUID REFERENCES public.work_units(id),
  application_type application_type NOT NULL,
  status application_status NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  description TEXT,
  
  -- Timestamps for workflow stages
  submitted_at TIMESTAMP WITH TIME ZONE,
  admin_unit_reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_unit_reviewed_by UUID REFERENCES auth.users(id),
  admin_pusat_reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_pusat_reviewed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Review notes
  admin_unit_notes TEXT,
  admin_pusat_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table for file attachments
CREATE TABLE public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Verification fields
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT
);

-- Create application history/timeline table
CREATE TABLE public.application_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status application_status,
  new_status application_status,
  notes TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications
-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

-- Admin Unit can view applications from their unit
CREATE POLICY "Admin Unit can view unit applications"
  ON public.applications FOR SELECT
  USING (
    has_role(auth.uid(), 'admin_unit'::app_role) 
    AND work_unit_id = (SELECT work_unit_id FROM public.profiles WHERE id = auth.uid())
  );

-- Admin Pusat can view all applications
CREATE POLICY "Admin Pusat can view all applications"
  ON public.applications FOR SELECT
  USING (has_role(auth.uid(), 'admin_pusat'::app_role));

-- Users can create their own applications
CREATE POLICY "Users can create applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own draft applications
CREATE POLICY "Users can update own draft applications"
  ON public.applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

-- Admin Unit can update applications in their review stage
CREATE POLICY "Admin Unit can update reviewing applications"
  ON public.applications FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin_unit'::app_role)
    AND work_unit_id = (SELECT work_unit_id FROM public.profiles WHERE id = auth.uid())
    AND status IN ('submitted', 'admin_unit_review')
  );

-- Admin Pusat can update applications in their review stage
CREATE POLICY "Admin Pusat can update reviewing applications"
  ON public.applications FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin_pusat'::app_role)
    AND status IN ('admin_unit_approved', 'admin_pusat_review')
  );

-- RLS Policies for application_documents
CREATE POLICY "Users can view documents of their applications"
  ON public.application_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admin Unit can view documents from their unit"
  ON public.application_documents FOR SELECT
  USING (
    has_role(auth.uid(), 'admin_unit'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.applications
      WHERE id = application_id 
      AND work_unit_id = (SELECT work_unit_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admin Pusat can view all documents"
  ON public.application_documents FOR SELECT
  USING (has_role(auth.uid(), 'admin_pusat'::app_role));

CREATE POLICY "Users can upload documents to their applications"
  ON public.application_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for application_history
CREATE POLICY "Users can view history of their applications"
  ON public.application_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admin Unit can view history from their unit"
  ON public.application_history FOR SELECT
  USING (
    has_role(auth.uid(), 'admin_unit'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.applications
      WHERE id = application_id 
      AND work_unit_id = (SELECT work_unit_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admin Pusat can view all history"
  ON public.application_history FOR SELECT
  USING (has_role(auth.uid(), 'admin_pusat'::app_role));

CREATE POLICY "System can insert history"
  ON public.application_history FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_work_unit_id ON public.applications(work_unit_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_type ON public.applications(application_type);
CREATE INDEX idx_application_documents_application_id ON public.application_documents(application_id);
CREATE INDEX idx_application_history_application_id ON public.application_history(application_id);

-- Create trigger for updated_at
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log application status changes
CREATE OR REPLACE FUNCTION public.log_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.application_history (
      application_id,
      action,
      old_status,
      new_status,
      notes,
      performed_by
    ) VALUES (
      NEW.id,
      'status_changed',
      OLD.status,
      NEW.status,
      COALESCE(NEW.admin_unit_notes, NEW.admin_pusat_notes),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_application_status_change_trigger
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_application_status_change();