
-- Extend existing employees table to match PRD specifications
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS nik VARCHAR(16),
ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(50),
ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,
ADD COLUMN IF NOT EXISTS jenis_kelamin TEXT CHECK (jenis_kelamin IN ('L', 'P')),
ADD COLUMN IF NOT EXISTS agama VARCHAR(20),
ADD COLUMN IF NOT EXISTS status_pernikahan TEXT CHECK (status_pernikahan IN ('Belum Menikah', 'Menikah', 'Cerai Hidup', 'Cerai Mati')),
ADD COLUMN IF NOT EXISTS golongan_darah TEXT CHECK (golongan_darah IN ('A', 'B', 'AB', 'O')),
ADD COLUMN IF NOT EXISTS alamat_tinggal TEXT,
ADD COLUMN IF NOT EXISTS alamat_ktp TEXT,
ADD COLUMN IF NOT EXISTS telephone_rumah VARCHAR(15),
ADD COLUMN IF NOT EXISTS handphone VARCHAR(15),
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS tipe_pegawai TEXT CHECK (tipe_pegawai IN ('CPNS', 'PNS', 'PPPK', 'Honorer')),
ADD COLUMN IF NOT EXISTS pangkat_golongan VARCHAR(10),
ADD COLUMN IF NOT EXISTS pangkat_terakhir VARCHAR(50),
ADD COLUMN IF NOT EXISTS tmt_pangkat DATE,
ADD COLUMN IF NOT EXISTS masa_kerja_tahun INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS masa_kerja_bulan INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jabatan_terakhir VARCHAR(100),
ADD COLUMN IF NOT EXISTS kelas_jabatan VARCHAR(20),
ADD COLUMN IF NOT EXISTS tmt_jabatan DATE,
ADD COLUMN IF NOT EXISTS unit_kerja VARCHAR(100),
ADD COLUMN IF NOT EXISTS lokasi_kerja VARCHAR(100),
ADD COLUMN IF NOT EXISTS tmt_cpns DATE,
ADD COLUMN IF NOT EXISTS tmt_pns DATE,
ADD COLUMN IF NOT EXISTS tmt_pensiun DATE,
ADD COLUMN IF NOT EXISTS tanggal_pensiun DATE,
ADD COLUMN IF NOT EXISTS pendidikan_terakhir VARCHAR(50),
ADD COLUMN IF NOT EXISTS jurusan_pendidikan VARCHAR(100),
ADD COLUMN IF NOT EXISTS gelar_akademis_depan VARCHAR(20),
ADD COLUMN IF NOT EXISTS gelar_akademis_belakang VARCHAR(20),
ADD COLUMN IF NOT EXISTS bank VARCHAR(50),
ADD COLUMN IF NOT EXISTS rekening_gaji VARCHAR(30),
ADD COLUMN IF NOT EXISTS npwp VARCHAR(20),
ADD COLUMN IF NOT EXISTS askes VARCHAR(30),
ADD COLUMN IF NOT EXISTS taspen VARCHAR(30),
ADD COLUMN IF NOT EXISTS lhkpn BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create reference tables for better data management
CREATE TABLE IF NOT EXISTS public.ref_pangkat_golongan (
  id SERIAL PRIMARY KEY,
  kode VARCHAR(10) UNIQUE NOT NULL,
  nama_pangkat VARCHAR(50) NOT NULL,
  golongan VARCHAR(5) NOT NULL,
  tingkat VARCHAR(5) NOT NULL,
  urutan INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_jabatan (
  id SERIAL PRIMARY KEY,
  nama_jabatan VARCHAR(100) NOT NULL,
  kelas_jabatan TEXT CHECK (kelas_jabatan IN ('Struktural', 'Fungsional', 'Pelaksana')),
  level_jabatan INTEGER,
  unit_kerja VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ref_unit_kerja (
  id SERIAL PRIMARY KEY,
  kode_unit VARCHAR(20) UNIQUE NOT NULL,
  nama_unit VARCHAR(100) NOT NULL,
  parent_unit_id INTEGER REFERENCES public.ref_unit_kerja(id),
  level_unit INTEGER DEFAULT 1,
  alamat_unit TEXT,
  telepon_unit VARCHAR(15),
  kepala_unit VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert sample reference data for pangkat golongan
INSERT INTO public.ref_pangkat_golongan (kode, nama_pangkat, golongan, tingkat, urutan) VALUES
('I/a', 'Juru Muda', 'I', 'a', 1),
('I/b', 'Juru Muda Tingkat I', 'I', 'b', 2),
('I/c', 'Juru', 'I', 'c', 3),
('I/d', 'Juru Tingkat I', 'I', 'd', 4),
('II/a', 'Pengatur Muda', 'II', 'a', 5),
('II/b', 'Pengatur Muda Tingkat I', 'II', 'b', 6),
('II/c', 'Pengatur', 'II', 'c', 7),
('II/d', 'Pengatur Tingkat I', 'II', 'd', 8),
('III/a', 'Penata Muda', 'III', 'a', 9),
('III/b', 'Penata Muda Tingkat I', 'III', 'b', 10),
('III/c', 'Penata', 'III', 'c', 11),
('III/d', 'Penata Tingkat I', 'III', 'd', 12),
('IV/a', 'Pembina', 'IV', 'a', 13),
('IV/b', 'Pembina Tingkat I', 'IV', 'b', 14),
('IV/c', 'Pembina Utama Muda', 'IV', 'c', 15),
('IV/d', 'Pembina Utama Madya', 'IV', 'd', 16),
('IV/e', 'Pembina Utama', 'IV', 'e', 17)
ON CONFLICT (kode) DO NOTHING;

-- Insert sample unit kerja data
INSERT INTO public.ref_unit_kerja (kode_unit, nama_unit, level_unit) VALUES
('BKPSDM', 'Badan Kepegawaian dan Pengembangan SDM', 1),
('DIKNAS', 'Dinas Pendidikan', 1),
('DINKES', 'Dinas Kesehatan', 1),
('DISHUB', 'Dinas Perhubungan', 1),
('DISKOMINFO', 'Dinas Komunikasi dan Informatika', 1),
('DISSOS', 'Dinas Sosial', 1),
('DISNAKER', 'Dinas Tenaga Kerja', 1),
('DISPERIN', 'Dinas Perindustrian', 1),
('DISPAR', 'Dinas Pariwisata', 1),
('BAPPEDA', 'Badan Perencanaan Pembangunan Daerah', 1)
ON CONFLICT (kode_unit) DO NOTHING;

-- Insert sample jabatan data
INSERT INTO public.ref_jabatan (nama_jabatan, kelas_jabatan, level_jabatan, unit_kerja) VALUES
('Kepala Dinas', 'Struktural', 2, 'DIKNAS'),
('Sekretaris Dinas', 'Struktural', 3, 'DIKNAS'),
('Kepala Bidang', 'Struktural', 3, 'DIKNAS'),
('Kepala Seksi', 'Struktural', 4, 'DIKNAS'),
('Staff Administrasi', 'Pelaksana', 5, 'DIKNAS'),
('Guru', 'Fungsional', 5, 'DIKNAS'),
('Dokter', 'Fungsional', 4, 'DINKES'),
('Perawat', 'Fungsional', 5, 'DINKES'),
('Analis SDM', 'Fungsional', 4, 'BKPSDM'),
('Staff IT', 'Pelaksana', 5, 'DISKOMINFO')
ON CONFLICT DO NOTHING;

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_nik ON public.employees(nik);
CREATE INDEX IF NOT EXISTS idx_employees_tanggal_lahir ON public.employees(tanggal_lahir);
CREATE INDEX IF NOT EXISTS idx_employees_tmt_pensiun ON public.employees(tmt_pensiun);
CREATE INDEX IF NOT EXISTS idx_employees_unit_pangkat ON public.employees(unit_kerja, pangkat_golongan);
CREATE INDEX IF NOT EXISTS idx_employees_active ON public.employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_search ON public.employees USING gin(to_tsvector('indonesian', nama || ' ' || COALESCE(nip, '') || ' ' || COALESCE(unit_kerja, '')));

-- Enable RLS for reference tables
ALTER TABLE public.ref_pangkat_golongan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_jabatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_unit_kerja ENABLE ROW LEVEL SECURITY;

-- RLS policies for reference tables (readable by authenticated users)
CREATE POLICY "Reference data readable by authenticated users" 
  ON public.ref_pangkat_golongan 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Reference data readable by authenticated users" 
  ON public.ref_jabatan 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Reference data readable by authenticated users" 
  ON public.ref_unit_kerja 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Admin pusat can manage reference data
CREATE POLICY "Admin pusat can manage reference data" 
  ON public.ref_pangkat_golongan 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_pusat'
    )
  );

CREATE POLICY "Admin pusat can manage reference data" 
  ON public.ref_jabatan 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_pusat'
    )
  );

CREATE POLICY "Admin pusat can manage reference data" 
  ON public.ref_unit_kerja 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_pusat'
    )
  );

-- Function to auto-calculate TMT Pensiun (age 60)
CREATE OR REPLACE FUNCTION public.calculate_tmt_pensiun()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tanggal_lahir IS NOT NULL THEN
    NEW.tmt_pensiun := NEW.tanggal_lahir + INTERVAL '60 years';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-calculate TMT Pensiun
DROP TRIGGER IF EXISTS trigger_calculate_tmt_pensiun ON public.employees;
CREATE TRIGGER trigger_calculate_tmt_pensiun
    BEFORE INSERT OR UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_tmt_pensiun();

-- Function to calculate masa kerja
CREATE OR REPLACE FUNCTION public.calculate_masa_kerja(tmt_cpns_date DATE)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    years INTEGER;
    months INTEGER;
BEGIN
    IF tmt_cpns_date IS NULL THEN
        RETURN '0 tahun 0 bulan';
    END IF;
    
    years := DATE_PART('year', AGE(CURRENT_DATE, tmt_cpns_date));
    months := DATE_PART('month', AGE(CURRENT_DATE, tmt_cpns_date));
    
    RETURN years || ' tahun ' || months || ' bulan';
END;
$$;

-- Create workflow status enum for better status management
CREATE TYPE public.workflow_status AS ENUM (
    'draft',
    'submitted', 
    'in_review',
    'revision_needed',
    'approved',
    'rejected',
    'completed'
);

-- Update usulan_mutasi status to use enum
ALTER TABLE public.usulan_mutasi 
DROP CONSTRAINT IF EXISTS usulan_mutasi_status_check;

-- Add the new enum constraint
ALTER TABLE public.usulan_mutasi 
ALTER COLUMN status TYPE public.workflow_status USING status::public.workflow_status;

-- Create notification system
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read_at TIMESTAMP WITH TIME ZONE,
  entity_type TEXT, -- 'usulan_mutasi', 'employee', etc
  entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = recipient_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = recipient_id);

-- Admin pusat can create notifications
CREATE POLICY "Admin pusat can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin_pusat'
    )
  );

-- System can create notifications (for triggers)
CREATE POLICY "System can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient_id UUID,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_type TEXT DEFAULT 'info',
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    recipient_id, title, body, type, entity_type, entity_id
  ) VALUES (
    p_recipient_id, p_title, p_body, p_type, p_entity_type, p_entity_id
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to notify on usulan status change
CREATE OR REPLACE FUNCTION public.notify_usulan_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Only notify on status change
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Generate notification content based on status
  CASE NEW.status
    WHEN 'submitted' THEN
      notification_title := 'Usulan Mutasi Disubmit';
      notification_body := 'Usulan mutasi ' || NEW.nomor_usulan || ' telah disubmit dan menunggu verifikasi.';
    WHEN 'in_review' THEN
      notification_title := 'Usulan Mutasi Sedang Direview';
      notification_body := 'Usulan mutasi ' || NEW.nomor_usulan || ' sedang dalam proses review oleh admin pusat.';
    WHEN 'revision_needed' THEN
      notification_title := 'Usulan Mutasi Perlu Revisi';
      notification_body := 'Usulan mutasi ' || NEW.nomor_usulan || ' memerlukan revisi. Silakan periksa catatan reviewer.';
    WHEN 'approved' THEN
      notification_title := 'Usulan Mutasi Disetujui';
      notification_body := 'Selamat! Usulan mutasi ' || NEW.nomor_usulan || ' telah disetujui.';
    WHEN 'rejected' THEN
      notification_title := 'Usulan Mutasi Ditolak';
      notification_body := 'Usulan mutasi ' || NEW.nomor_usulan || ' ditolak. Silakan periksa catatan reviewer.';
    WHEN 'completed' THEN
      notification_title := 'Usulan Mutasi Selesai';
      notification_body := 'Usulan mutasi ' || NEW.nomor_usulan || ' telah selesai diproses.';
    ELSE
      RETURN NEW;
  END CASE;
  
  -- Create notification for the user
  PERFORM public.create_notification(
    NEW.user_id,
    notification_title,
    notification_body,
    CASE NEW.status 
      WHEN 'approved' THEN 'success'
      WHEN 'rejected' THEN 'error'
      WHEN 'revision_needed' THEN 'warning'
      ELSE 'info'
    END,
    'usulan_mutasi',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for usulan status notifications
DROP TRIGGER IF EXISTS trigger_notify_usulan_status_change ON public.usulan_mutasi;
CREATE TRIGGER trigger_notify_usulan_status_change
    AFTER INSERT OR UPDATE ON public.usulan_mutasi
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_usulan_status_change();
