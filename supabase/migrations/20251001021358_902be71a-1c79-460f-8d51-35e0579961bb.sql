-- Step 1: Create work_units master data table
CREATE TABLE IF NOT EXISTS public.work_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text UNIQUE,
  category text NOT NULL CHECK (category IN ('Sekretariat', 'Direktorat', 'Balai Besar', 'Balai')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on work_units
ALTER TABLE public.work_units ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active work units
CREATE POLICY "Everyone can view active work units"
ON public.work_units
FOR SELECT
USING (is_active = true);

-- Policy: Only admin_pusat can manage work units
CREATE POLICY "Admin pusat can manage work units"
ON public.work_units
FOR ALL
USING (is_admin_pusat())
WITH CHECK (is_admin_pusat());

-- Insert the 28 work units
INSERT INTO public.work_units (name, code, category) VALUES
('Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas', 'SETDITJEN', 'Sekretariat'),
('Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan', 'DITSTANKOMPROG', 'Direktorat'),
('Direktorat Pembinaan Kelembagaan Pelatihan Vokasi', 'DITLEMVOK', 'Direktorat'),
('Direktorat Pembinaan Penyelenggaraan Pelatihan Vokasi dan Pemagangan', 'DITSELENMAGANG', 'Direktorat'),
('Direktorat Pembinaan Instruktur dan Tenaga Pelatihan', 'DITINSLAT', 'Direktorat'),
('Direktorat Pembinaan Peningkatan Produktivitas', 'DITPRODUK', 'Direktorat'),
('Sekretariat Badan Nasional Sertifikasi Profesi', 'SETBNSP', 'Sekretariat'),
('Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi', 'BBPVP-BKS', 'Balai Besar'),
('Balai Besar Pelatihan Vokasi dan Produktivitas Bandung', 'BBPVP-BDG', 'Balai Besar'),
('Balai Besar Pelatihan Vokasi dan Produktivitas Serang', 'BBPVP-SRG', 'Balai Besar'),
('Balai Besar Pelatihan Vokasi dan Produktivitas Medan', 'BBPVP-MDN', 'Balai Besar'),
('Balai Besar Pelatihan Vokasi dan Produktivitas Semarang', 'BBPVP-SMG', 'Balai Besar'),
('Balai Besar Pelatihan Vokasi dan Produktivitas Makassar', 'BBPVP-MKS', 'Balai Besar'),
('Balai Pelatihan Vokasi dan Produktivitas Surakarta', 'BPVP-SKA', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Ambon', 'BPVP-AMB', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Ternate', 'BPVP-TTE', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Banda Aceh', 'BPVP-ACH', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Sorong', 'BPVP-SRG', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Kendari', 'BPVP-KDI', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Samarinda', 'BPVP-SMD', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Padang', 'BPVP-PDG', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Bandung Barat', 'BPVP-BBR', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Lombok Timur', 'BPVP-LTM', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Bantaeng', 'BPVP-BTG', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Banyuwangi', 'BPVP-BWI', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Sidoarjo', 'BPVP-SDA', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Pangkajene dan Kepulauan', 'BPVP-PKP', 'Balai'),
('Balai Pelatihan Vokasi dan Produktivitas Belitung', 'BPVP-BLT', 'Balai')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create security definer function to check if user can edit employee from specific unit
CREATE OR REPLACE FUNCTION public.can_edit_employee_unit(employee_unit text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN is_admin_pusat() THEN true
      WHEN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin_unit' 
        AND unit = employee_unit
      ) THEN true
      ELSE false
    END;
$$;

-- Step 3: Drop existing restrictive RLS policies on employees
DROP POLICY IF EXISTS "employees_select_by_role" ON public.employees;
DROP POLICY IF EXISTS "employees_write" ON public.employees;

-- Step 4: Create new RLS policies for employees
-- Allow all authenticated users to view ALL employee data
CREATE POLICY "All authenticated users can view all employees"
ON public.employees
FOR SELECT
TO authenticated
USING (true);

-- Admin pusat can insert any employee
CREATE POLICY "Admin pusat can insert employees"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (is_admin_pusat());

-- Admin unit can insert employees only for their unit
CREATE POLICY "Admin unit can insert employees for their unit"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin_unit' 
    AND unit = employees.unit
  )
);

-- Admin pusat can update any employee
CREATE POLICY "Admin pusat can update all employees"
ON public.employees
FOR UPDATE
TO authenticated
USING (is_admin_pusat());

-- Admin unit can update employees only from their unit
CREATE POLICY "Admin unit can update employees from their unit"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin_unit' 
    AND unit = employees.unit
  )
);

-- Admin pusat can delete any employee
CREATE POLICY "Admin pusat can delete all employees"
ON public.employees
FOR DELETE
TO authenticated
USING (is_admin_pusat());

-- Admin unit can delete employees only from their unit
CREATE POLICY "Admin unit can delete employees from their unit"
ON public.employees
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin_unit' 
    AND unit = employees.unit
  )
);

-- Add trigger for updated_at on work_units
CREATE TRIGGER update_work_units_updated_at
BEFORE UPDATE ON public.work_units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();