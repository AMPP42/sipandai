-- Drop and recreate the ticket number generation function without FOR UPDATE
DROP TRIGGER IF EXISTS set_consultation_ticket_number ON consultation_tickets CASCADE;
DROP FUNCTION IF EXISTS set_consultation_ticket_number() CASCADE;

-- Create improved ticket number generation function
CREATE OR REPLACE FUNCTION set_consultation_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  ticket_count INTEGER;
  new_number TEXT;
BEGIN
  -- Only generate if nomor_ticket is null or empty
  IF NEW.nomor_ticket IS NULL OR NEW.nomor_ticket = '' THEN
    current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Count tickets for current year (removed FOR UPDATE)
    SELECT COUNT(*) INTO ticket_count
    FROM consultation_tickets
    WHERE nomor_ticket LIKE 'TKT/' || current_year || '/%';
    
    -- Generate new ticket number
    new_number := 'TKT/' || current_year || '/' || LPAD((ticket_count + 1)::TEXT, 4, '0');
    
    NEW.nomor_ticket := new_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_consultation_ticket_number
  BEFORE INSERT ON consultation_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_consultation_ticket_number();