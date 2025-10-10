-- Update the calculate_employee_data function to determine retirement age based on jabatan
CREATE OR REPLACE FUNCTION public.calculate_employee_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  retirement_age INTEGER;
BEGIN
  -- Determine retirement age based on jabatan
  IF NEW.jabatan IS NOT NULL THEN
    -- Check for "Ahli Utama" first (65 years)
    IF NEW.jabatan ILIKE '%Ahli Utama%' THEN
      retirement_age := 65;
    -- Check for "Ahli Madya" (60 years)
    ELSIF NEW.jabatan ILIKE '%Ahli Madya%' THEN
      retirement_age := 60;
    -- Check for "Ahli Pertama" or "Ahli Muda" (58 years)
    ELSIF NEW.jabatan ILIKE '%Ahli Pertama%' OR NEW.jabatan ILIKE '%Ahli Muda%' THEN
      retirement_age := 58;
    -- Check for "Direktur Jenderal" (60 years)
    ELSIF NEW.jabatan ILIKE '%Direktur Jenderal%' THEN
      retirement_age := 60;
    -- Check if contains "Ahli" at all (if yes but not matched above, default to 58)
    ELSIF NEW.jabatan ILIKE '%Ahli%' THEN
      retirement_age := 58;
    -- No "Ahli" keyword (58 years)
    ELSE
      retirement_age := 58;
    END IF;
  ELSE
    -- Default retirement age if jabatan is null
    retirement_age := 58;
  END IF;
  
  -- Auto-calculate TMT Pensiun if tanggal_lahir is provided and tmt_pensiun is null
  IF NEW.tanggal_lahir IS NOT NULL AND NEW.tmt_pensiun IS NULL THEN
    NEW.tmt_pensiun := NEW.tanggal_lahir + (retirement_age || ' years')::INTERVAL;
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
$function$;