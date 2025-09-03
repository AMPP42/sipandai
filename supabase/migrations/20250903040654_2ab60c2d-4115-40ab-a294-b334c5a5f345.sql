-- Update employees table structure to match new requirements

-- Add all the new columns if they don't exist
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS nik text,
ADD COLUMN IF NOT EXISTS tempat_lahir text,
ADD COLUMN IF NOT EXISTS tanggal_lahir date,
ADD COLUMN IF NOT EXISTS jenis_kelamin text,
ADD COLUMN IF NOT EXISTS agama text,
ADD COLUMN IF NOT EXISTS status_pernikahan text,
ADD COLUMN IF NOT EXISTS pendidikan_terakhir text,
ADD COLUMN IF NOT EXISTS handphone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS alamat text,
ADD COLUMN IF NOT EXISTS kriteria_asn text,
ADD COLUMN IF NOT EXISTS grade_kelas_jabatan text,
ADD COLUMN IF NOT EXISTS tmt_jabatan_terakhir date,
ADD COLUMN IF NOT EXISTS tmt_pangkat_terakhir date,
ADD COLUMN IF NOT EXISTS tmt_cpns date,
ADD COLUMN IF NOT EXISTS tmt_pns date,
ADD COLUMN IF NOT EXISTS tmt_pensiun date,
ADD COLUMN IF NOT EXISTS masa_kerja text;

-- Add check constraints for enum-like fields
ALTER TABLE public.employees 
ADD CONSTRAINT IF NOT EXISTS chk_jenis_kelamin CHECK (jenis_kelamin IN ('L', 'P'));

ALTER TABLE public.employees 
ADD CONSTRAINT IF NOT EXISTS chk_status_pernikahan CHECK (status_pernikahan IN ('Belum Menikah', 'Menikah', 'Cerai Hidup', 'Cerai Mati'));

ALTER TABLE public.employees 
ADD CONSTRAINT IF NOT EXISTS chk_kriteria_asn CHECK (kriteria_asn IN ('PNS', 'PPPK'));

-- Add unique constraints for important fields (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_nip_unique') THEN
        ALTER TABLE public.employees ADD CONSTRAINT employees_nip_unique UNIQUE (nip);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_nik_unique') THEN
        ALTER TABLE public.employees ADD CONSTRAINT employees_nik_unique UNIQUE (nik);
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_nip ON public.employees(nip);
CREATE INDEX IF NOT EXISTS idx_employees_nik ON public.employees(nik);
CREATE INDEX IF NOT EXISTS idx_employees_nama ON public.employees(nama);
CREATE INDEX IF NOT EXISTS idx_employees_unit ON public.employees(unit);
CREATE INDEX IF NOT EXISTS idx_employees_pangkat ON public.employees(pangkat);
CREATE INDEX IF NOT EXISTS idx_employees_tmt_pensiun ON public.employees(tmt_pensiun);

-- Create a function to auto-calculate TMT Pensiun and masa kerja
CREATE OR REPLACE FUNCTION public.calculate_employee_data()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for auto-calculation
DROP TRIGGER IF EXISTS trigger_calculate_employee_data ON public.employees;
CREATE TRIGGER trigger_calculate_employee_data
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_employee_data();