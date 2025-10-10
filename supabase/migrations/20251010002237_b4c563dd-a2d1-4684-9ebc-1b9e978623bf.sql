-- Update all existing employees' TMT Pensiun based on jabatan and tanggal_lahir
UPDATE public.employees
SET tmt_pensiun = CASE
  -- Ahli Utama (65 years)
  WHEN jabatan ILIKE '%Ahli Utama%' THEN tanggal_lahir + INTERVAL '65 years'
  -- Ahli Madya (60 years)
  WHEN jabatan ILIKE '%Ahli Madya%' THEN tanggal_lahir + INTERVAL '60 years'
  -- Ahli Pertama or Ahli Muda (58 years)
  WHEN jabatan ILIKE '%Ahli Pertama%' OR jabatan ILIKE '%Ahli Muda%' THEN tanggal_lahir + INTERVAL '58 years'
  -- Direktur Jenderal (60 years)
  WHEN jabatan ILIKE '%Direktur Jenderal%' THEN tanggal_lahir + INTERVAL '60 years'
  -- Contains "Ahli" but not matched above (58 years)
  WHEN jabatan ILIKE '%Ahli%' THEN tanggal_lahir + INTERVAL '58 years'
  -- Default (58 years)
  ELSE tanggal_lahir + INTERVAL '58 years'
END
WHERE tanggal_lahir IS NOT NULL;