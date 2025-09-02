
-- Create table for mutation proposals
CREATE TABLE public.usulan_mutasi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  nomor_usulan TEXT NOT NULL UNIQUE,
  nama_pegawai TEXT NOT NULL,
  nip TEXT NOT NULL,
  unit_asal TEXT NOT NULL,
  unit_tujuan TEXT NOT NULL,
  jenis_mutasi TEXT NOT NULL CHECK (jenis_mutasi IN ('promosi', 'rotasi', 'demosi', 'pindah_unit')),
  alasan_mutasi TEXT NOT NULL,
  tanggal_usulan DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'diajukan', 'dalam_review', 'disetujui', 'ditolak')),
  catatan_reviewer TEXT,
  reviewed_by UUID REFERENCES auth.users,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for required documents
CREATE TABLE public.dokumen_usulan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usulan_id UUID REFERENCES public.usulan_mutasi(id) ON DELETE CASCADE NOT NULL,
  nama_dokumen TEXT NOT NULL,
  jenis_dokumen TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_required BOOLEAN DEFAULT true,
  status_verifikasi TEXT DEFAULT 'pending' CHECK (status_verifikasi IN ('pending', 'verified', 'rejected')),
  catatan_verifikasi TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_usulan_mutasi_user_id ON public.usulan_mutasi(user_id);
CREATE INDEX idx_usulan_mutasi_status ON public.usulan_mutasi(status);
CREATE INDEX idx_usulan_mutasi_tanggal ON public.usulan_mutasi(tanggal_usulan);
CREATE INDEX idx_dokumen_usulan_usulan_id ON public.dokumen_usulan(usulan_id);

-- Enable Row Level Security
ALTER TABLE public.usulan_mutasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dokumen_usulan ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usulan_mutasi
-- Users can view their own proposals
CREATE POLICY "Users can view their own proposals" 
  ON public.usulan_mutasi 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Admin pusat can view all proposals
CREATE POLICY "Admin pusat can view all proposals" 
  ON public.usulan_mutasi 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_pusat'
    )
  );

-- Users can create their own proposals
CREATE POLICY "Users can create their own proposals" 
  ON public.usulan_mutasi 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own proposals (only if status is draft)
CREATE POLICY "Users can update their own draft proposals" 
  ON public.usulan_mutasi 
  FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'draft');

-- Admin pusat can update all proposals
CREATE POLICY "Admin pusat can update all proposals" 
  ON public.usulan_mutasi 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_pusat'
    )
  );

-- RLS Policies for dokumen_usulan
-- Users can view documents of their own proposals
CREATE POLICY "Users can view documents of their own proposals" 
  ON public.dokumen_usulan 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.usulan_mutasi 
      WHERE usulan_mutasi.id = dokumen_usulan.usulan_id 
      AND usulan_mutasi.user_id = auth.uid()
    )
  );

-- Admin pusat can view all documents
CREATE POLICY "Admin pusat can view all documents" 
  ON public.dokumen_usulan 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_pusat'
    )
  );

-- Users can create documents for their own proposals
CREATE POLICY "Users can create documents for their own proposals" 
  ON public.dokumen_usulan 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usulan_mutasi 
      WHERE usulan_mutasi.id = dokumen_usulan.usulan_id 
      AND usulan_mutasi.user_id = auth.uid()
    )
  );

-- Users can update documents of their own proposals
CREATE POLICY "Users can update documents of their own proposals" 
  ON public.dokumen_usulan 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.usulan_mutasi 
      WHERE usulan_mutasi.id = dokumen_usulan.usulan_id 
      AND usulan_mutasi.user_id = auth.uid()
    )
  );

-- Admin pusat can update all documents
CREATE POLICY "Admin pusat can update all documents" 
  ON public.dokumen_usulan 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_pusat'
    )
  );

-- Function to generate unique proposal number
CREATE OR REPLACE FUNCTION generate_nomor_usulan()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    current_year TEXT;
    sequence_num TEXT;
    counter INTEGER;
BEGIN
    -- Get current year
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Get the count of proposals this year + 1
    SELECT COUNT(*) + 1 INTO counter
    FROM public.usulan_mutasi 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Format sequence number with leading zeros
    sequence_num := LPAD(counter::TEXT, 4, '0');
    
    -- Return formatted proposal number
    RETURN 'MUT/' || current_year || '/' || sequence_num;
END;
$$;

-- Trigger to auto-generate proposal number
CREATE OR REPLACE FUNCTION set_nomor_usulan()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.nomor_usulan IS NULL OR NEW.nomor_usulan = '' THEN
        NEW.nomor_usulan := generate_nomor_usulan();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_nomor_usulan
    BEFORE INSERT ON public.usulan_mutasi
    FOR EACH ROW
    EXECUTE FUNCTION set_nomor_usulan();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_usulan_mutasi_updated_at
    BEFORE UPDATE ON public.usulan_mutasi
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
