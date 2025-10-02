-- Fix typo in positions table: "Sekretriat" -> "Sekretariat"

-- Show current data before fix
SELECT id, unit, jabatan 
FROM public.positions 
WHERE unit LIKE '%Sekretriat%'
ORDER BY unit;

-- Update the typo
UPDATE public.positions
SET unit = 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas'
WHERE unit = 'Sekretriat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas';

-- Verify the fix
SELECT id, unit, jabatan 
FROM public.positions 
WHERE unit LIKE '%Sekretariat Direktorat Jenderal%'
ORDER BY unit;

-- Show total count per unit
SELECT unit, COUNT(*) as total_positions
FROM public.positions
GROUP BY unit
ORDER BY unit;
