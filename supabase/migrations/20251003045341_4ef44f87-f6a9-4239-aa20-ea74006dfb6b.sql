-- First, remove the default value from the column
ALTER TABLE consultation_tickets ALTER COLUMN nomor_ticket DROP DEFAULT;

-- Drop existing trigger, function, and dependent objects with CASCADE
DROP TRIGGER IF EXISTS set_consultation_ticket_number ON consultation_tickets;
DROP FUNCTION IF EXISTS set_ticket_number() CASCADE;
DROP FUNCTION IF EXISTS generate_ticket_number() CASCADE;

-- Create proper trigger function
CREATE OR REPLACE FUNCTION set_consultation_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  ticket_year TEXT;
  ticket_count INTEGER;
  new_ticket_number TEXT;
BEGIN
  -- Only generate if nomor_ticket is null or empty
  IF NEW.nomor_ticket IS NULL OR NEW.nomor_ticket = '' THEN
    -- Get current year
    ticket_year := TO_CHAR(NOW(), 'YYYY');
    
    -- Count tickets created this year (with lock to prevent race conditions)
    SELECT COUNT(*) + 1 INTO ticket_count
    FROM consultation_tickets
    WHERE TO_CHAR(created_at, 'YYYY') = ticket_year
    FOR UPDATE;
    
    -- Generate ticket number: TKT/YYYY/NNNN
    new_ticket_number := 'TKT/' || ticket_year || '/' || LPAD(ticket_count::TEXT, 4, '0');
    
    -- Set the ticket number
    NEW.nomor_ticket := new_ticket_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_consultation_ticket_number_trigger
  BEFORE INSERT ON consultation_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_consultation_ticket_number();