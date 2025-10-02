-- Add sample positions data for formasi jabatan
-- This migration adds sample data to the positions table

-- First, let's temporarily disable RLS for positions table to insert data
ALTER TABLE public.positions DISABLE ROW LEVEL SECURITY;

-- Insert sample positions data
INSERT INTO public.positions (unit, jabatan, existing, kebutuhan) VALUES
-- Sekretariat Direktorat Jenderal
('Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas', 'Direktur Jenderal', 1, 1),
('Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas', 'Sekretaris Direktorat Jenderal', 1, 1),
('Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas', 'Kepala Bagian Umum', 0, 1),
('Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas', 'Kepala Bagian Keuangan', 0, 1),
('Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas', 'Staff Administrasi', 2, 5),

-- Direktorat Pembinaan Standarisasi Kompetensi
('Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan', 'Direktur', 1, 1),
('Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan', 'Sekretaris Direktorat', 0, 1),
('Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan', 'Kepala Bidang Standarisasi', 0, 1),
('Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan', 'Kepala Bidang Program Pelatihan', 0, 1),
('Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan', 'Analis Kebijakan', 1, 3),

-- Direktorat Pembinaan Kelembagaan Pelatihan Vokasi
('Direktorat Pembinaan Kelembagaan Pelatihan Vokasi', 'Direktur', 0, 1),
('Direktorat Pembinaan Kelembagaan Pelatihan Vokasi', 'Sekretaris Direktorat', 0, 1),
('Direktorat Pembinaan Kelembagaan Pelatihan Vokasi', 'Kepala Bidang Kelembagaan', 0, 1),
('Direktorat Pembinaan Kelembagaan Pelatihan Vokasi', 'Kepala Bidang Vokasi', 0, 1),
('Direktorat Pembinaan Kelembagaan Pelatihan Vokasi', 'Staff Kelembagaan', 1, 4),

-- Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi
('Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi', 'Kepala Balai Besar', 1, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi', 'Sekretaris Balai Besar', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi', 'Kepala Bagian Administrasi', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi', 'Kepala Bagian Teknis', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi', 'Instruktur Pelatihan', 2, 8),
('Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi', 'Staff Administrasi', 1, 3),

-- Balai Besar Pelatihan Vokasi dan Produktivitas Bandung
('Balai Besar Pelatihan Vokasi dan Produktivitas Bandung', 'Kepala Balai Besar', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Bandung', 'Sekretaris Balai Besar', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Bandung', 'Kepala Bagian Administrasi', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Bandung', 'Kepala Bagian Teknis', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Bandung', 'Instruktur Pelatihan', 1, 6),
('Balai Besar Pelatihan Vokasi dan Produktivitas Bandung', 'Staff Administrasi', 0, 2),

-- Balai Besar Pelatihan Vokasi dan Produktivitas Serang
('Balai Besar Pelatihan Vokasi dan Produktivitas Serang', 'Kepala Balai Besar', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Serang', 'Sekretaris Balai Besar', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Serang', 'Kepala Bagian Administrasi', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Serang', 'Kepala Bagian Teknis', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Serang', 'Instruktur Pelatihan', 0, 5),
('Balai Besar Pelatihan Vokasi dan Produktivitas Serang', 'Staff Administrasi', 0, 2),

-- Balai Besar Pelatihan Vokasi dan Produktivitas Medan
('Balai Besar Pelatihan Vokasi dan Produktivitas Medan', 'Kepala Balai Besar', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Medan', 'Sekretaris Balai Besar', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Medan', 'Kepala Bagian Administrasi', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Medan', 'Kepala Bagian Teknis', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Medan', 'Instruktur Pelatihan', 0, 5),
('Balai Besar Pelatihan Vokasi dan Produktivitas Medan', 'Staff Administrasi', 0, 2),

-- Balai Besar Pelatihan Vokasi dan Produktivitas Semarang
('Balai Besar Pelatihan Vokasi dan Produktivitas Semarang', 'Kepala Balai Besar', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Semarang', 'Sekretaris Balai Besar', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Semarang', 'Kepala Bagian Administrasi', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Semarang', 'Kepala Bagian Teknis', 0, 1),
('Balai Besar Pelatihan Vokasi dan Produktivitas Semarang', 'Instruktur Pelatihan', 0, 5),
('Balai Besar Pelatihan Vokasi dan Produktivitas Semarang', 'Staff Administrasi', 0, 2);

-- Re-enable RLS for positions table
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Update the RLS policy to allow everyone to read positions (since it's reference data)
DROP POLICY IF EXISTS "positions_select_by_role" ON public.positions;

CREATE POLICY "positions_select_everyone" 
ON public.positions 
FOR SELECT 
USING (true);

-- Allow admin_pusat to manage positions
CREATE POLICY "positions_admin_manage" 
ON public.positions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin_pusat'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin_pusat'
  )
);
