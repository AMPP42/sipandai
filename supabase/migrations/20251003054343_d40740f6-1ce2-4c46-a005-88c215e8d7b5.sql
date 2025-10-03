-- Use a sequence to guarantee unique, concurrent-safe ticket numbers
-- 1) Create sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS public.consultation_ticket_seq;

-- 2) Recreate trigger function to use the sequence (sets explicit search_path)
DROP FUNCTION IF EXISTS public.set_consultation_ticket_number() CASCADE;
CREATE OR REPLACE FUNCTION public.set_consultation_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  seq_val BIGINT;
BEGIN
  IF NEW.nomor_ticket IS NULL OR NEW.nomor_ticket = '' THEN
    current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    seq_val := nextval('public.consultation_ticket_seq');
    NEW.nomor_ticket := 'TKT/' || current_year || '/' || LPAD(seq_val::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Recreate trigger on consultation_tickets
DROP TRIGGER IF EXISTS set_consultation_ticket_number ON public.consultation_tickets;
CREATE TRIGGER set_consultation_ticket_number
  BEFORE INSERT ON public.consultation_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_consultation_ticket_number();
