-- Create RPC function to get positions data without RLS restrictions
-- This function will be used by the Pengajuan Mutasi Terpadu application

CREATE OR REPLACE FUNCTION get_positions()
RETURNS TABLE (
  id uuid,
  unit text,
  jabatan text,
  existing integer,
  kebutuhan integer,
  gap integer,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.unit,
    p.jabatan,
    p.existing,
    p.kebutuhan,
    p.gap,
    p.status,
    p.created_at,
    p.updated_at
  FROM public.positions p
  ORDER BY p.unit, p.jabatan;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_positions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_positions() TO anon;
