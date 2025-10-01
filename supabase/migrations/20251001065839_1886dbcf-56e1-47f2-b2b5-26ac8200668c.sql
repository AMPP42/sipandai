-- Fix 1: Ensure ticket number trigger is properly attached
DROP TRIGGER IF EXISTS set_consultation_ticket_number ON consultation_tickets;

CREATE TRIGGER set_consultation_ticket_number
  BEFORE INSERT ON consultation_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Fix 2: Update existing tickets without numbers
UPDATE consultation_tickets 
SET nomor_ticket = generate_ticket_number()
WHERE nomor_ticket IS NULL OR nomor_ticket = '';

-- Fix 3: Make nomor_ticket NOT NULL with default
ALTER TABLE consultation_tickets 
  ALTER COLUMN nomor_ticket SET DEFAULT generate_ticket_number(),
  ALTER COLUMN nomor_ticket SET NOT NULL;