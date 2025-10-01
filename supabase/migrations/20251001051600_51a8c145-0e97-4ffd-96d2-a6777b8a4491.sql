-- Create ranks/pangkat reference table
CREATE TABLE IF NOT EXISTS public.ranks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  golongan TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert standard Indonesian civil servant ranks (Golongan PNS)
INSERT INTO public.ranks (code, name, level, golongan) VALUES
  ('I/a', 'Juru Muda', 1, 'I'),
  ('I/b', 'Juru Muda Tingkat I', 2, 'I'),
  ('I/c', 'Juru', 3, 'I'),
  ('I/d', 'Juru Tingkat I', 4, 'I'),
  ('II/a', 'Pengatur Muda', 5, 'II'),
  ('II/b', 'Pengatur Muda Tingkat I', 6, 'II'),
  ('II/c', 'Pengatur', 7, 'II'),
  ('II/d', 'Pengatur Tingkat I', 8, 'II'),
  ('III/a', 'Penata Muda', 9, 'III'),
  ('III/b', 'Penata Muda Tingkat I', 10, 'III'),
  ('III/c', 'Penata', 11, 'III'),
  ('III/d', 'Penata Tingkat I', 12, 'III'),
  ('IV/a', 'Pembina', 13, 'IV'),
  ('IV/b', 'Pembina Tingkat I', 14, 'IV'),
  ('IV/c', 'Pembina Utama Muda', 15, 'IV'),
  ('IV/d', 'Pembina Utama Madya', 16, 'IV'),
  ('IV/e', 'Pembina Utama', 17, 'IV');

-- Create mutation types reference table
CREATE TABLE IF NOT EXISTS public.mutation_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert mutation types
INSERT INTO public.mutation_types (code, name, description) VALUES
  ('promosi', 'Promosi', 'Kenaikan jabatan atau posisi'),
  ('rotasi', 'Rotasi', 'Perpindahan posisi setara'),
  ('demosi', 'Demosi', 'Penurunan jabatan'),
  ('pindah_unit', 'Pindah Unit', 'Perpindahan antar unit kerja'),
  ('mutasi_keluar', 'Mutasi Keluar', 'Mutasi ke instansi lain'),
  ('mutasi_masuk', 'Mutasi Masuk', 'Mutasi dari instansi lain');

-- Create consultation types reference table
CREATE TABLE IF NOT EXISTS public.consultation_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert consultation types
INSERT INTO public.consultation_types (code, name, description) VALUES
  ('mutasi', 'Mutasi', 'Konsultasi terkait mutasi pegawai'),
  ('kenaikan_pangkat', 'Kenaikan Pangkat', 'Konsultasi terkait kenaikan pangkat'),
  ('pensiun', 'Pensiun', 'Konsultasi terkait persiapan pensiun'),
  ('pengembangan_karir', 'Pengembangan Karir', 'Konsultasi pengembangan karir ASN'),
  ('disiplin', 'Disiplin', 'Konsultasi terkait disiplin pegawai'),
  ('lainnya', 'Lainnya', 'Konsultasi umum lainnya');

-- Create document types reference table
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert document types for mutation
INSERT INTO public.document_types (code, name, category, is_required) VALUES
  ('surat_lolos_butuh', 'Surat Pernyataan Lolos Butuh dari PPK Instansi Asal (Asli)', 'mutasi_terpadu', true),
  ('sk_tidak_hukuman', 'Surat Keterangan Tidak Sedang Menjalani Hukuman Disiplin (Asli)', 'mutasi_terpadu', true),
  ('sk_tidak_tugas_belajar', 'Surat Keterangan Tidak Sedang Menjalani Tugas Belajar/Ikatan Dinas (Asli)', 'mutasi_terpadu', true),
  ('sk_bebas_hutang', 'Surat Keterangan Tidak Mempunyai Hutang Piutang dengan Pihak Bank (Asli)', 'mutasi_terpadu', true),
  ('sk_bebas_temuan', 'Surat Pernyataan Bebas Temuan yang Diterbitkan oleh ITJEN (Asli)', 'mutasi_terpadu', true),
  ('anjab_abk', 'ANJAB dan ABK yang ditandatangani oleh PPK Instansi Asal', 'mutasi_terpadu', false),
  ('sk_cpns', 'SK CPNS (Fotokopi legalisir)', 'mutasi_terpadu', true),
  ('sk_pns', 'SK PNS (Fotokopi legalisir)', 'mutasi_terpadu', true),
  ('sk_pangkat', 'SK Pangkat Terakhir (Fotokopi legalisir)', 'mutasi_terpadu', true),
  ('sk_jabatan', 'SK Jabatan Terakhir (Fotokopi legalisir)', 'mutasi_terpadu', true),
  ('karpeg', 'KARPEG (Fotokopi legalisir)', 'mutasi_terpadu', true),
  ('ijazah', 'Ijazah dan Transkrip Nilai Universitas (Fotokopi legalisir)', 'mutasi_terpadu', true),
  ('skp', 'SKP 2 tahun terakhir (Fotokopi legalisir)', 'mutasi_terpadu', true),
  ('surat_permohonan', 'Surat permohonan mutasi dari ybs', 'mutasi_terpadu', true),
  ('drh', 'Daftar Riwayat Hidup (DRH)', 'mutasi_terpadu', true),
  ('nota_dinas', 'Nota Dinas Usulan Mutasi yang telah ditandatangani', 'mutasi_terpadu', true);

-- Enable RLS on all reference tables
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies: all authenticated users can read, only admin_pusat can manage
CREATE POLICY "Everyone can view active ranks"
  ON public.ranks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin pusat can manage ranks"
  ON public.ranks FOR ALL
  USING (is_admin_pusat())
  WITH CHECK (is_admin_pusat());

CREATE POLICY "Everyone can view active mutation types"
  ON public.mutation_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin pusat can manage mutation types"
  ON public.mutation_types FOR ALL
  USING (is_admin_pusat())
  WITH CHECK (is_admin_pusat());

CREATE POLICY "Everyone can view active consultation types"
  ON public.consultation_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin pusat can manage consultation types"
  ON public.consultation_types FOR ALL
  USING (is_admin_pusat())
  WITH CHECK (is_admin_pusat());

CREATE POLICY "Everyone can view active document types"
  ON public.document_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin pusat can manage document types"
  ON public.document_types FOR ALL
  USING (is_admin_pusat())
  WITH CHECK (is_admin_pusat());

-- Add triggers for updated_at
CREATE TRIGGER update_ranks_updated_at
  BEFORE UPDATE ON public.ranks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mutation_types_updated_at
  BEFORE UPDATE ON public.mutation_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultation_types_updated_at
  BEFORE UPDATE ON public.consultation_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_types_updated_at
  BEFORE UPDATE ON public.document_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();