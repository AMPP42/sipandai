-- Create consultation tickets table
CREATE TABLE public.consultation_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_ticket TEXT NOT NULL UNIQUE,
  judul TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  kategori TEXT NOT NULL,
  prioritas TEXT NOT NULL CHECK (prioritas IN ('rendah', 'sedang', 'tinggi', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_unit TEXT NOT NULL,
  konselor_id UUID,
  konselor_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create FAQ table
CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pertanyaan TEXT NOT NULL,
  jawaban TEXT NOT NULL,
  kategori TEXT NOT NULL,
  helpful INTEGER NOT NULL DEFAULT 0,
  not_helpful INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultation_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consultation_tickets
CREATE POLICY "Users can view their own tickets"
ON public.consultation_tickets
FOR SELECT
USING (user_id = auth.uid() OR konselor_id = auth.uid() OR is_admin_pusat());

CREATE POLICY "Users can create their own tickets"
ON public.consultation_tickets
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tickets"
ON public.consultation_tickets
FOR UPDATE
USING (user_id = auth.uid() OR konselor_id = auth.uid() OR is_admin_pusat());

CREATE POLICY "Admin can manage all tickets"
ON public.consultation_tickets
FOR ALL
USING (is_admin_pusat());

-- RLS Policies for faq_items
CREATE POLICY "Everyone can view active FAQs"
ON public.faq_items
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin can manage FAQs"
ON public.faq_items
FOR ALL
USING (is_admin_pusat());

-- Create function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    current_year TEXT;
    sequence_num TEXT;
    counter INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COUNT(*) + 1 INTO counter
    FROM public.consultation_tickets 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    sequence_num := LPAD(counter::TEXT, 4, '0');
    
    RETURN 'TKT/' || current_year || '/' || sequence_num;
END;
$$;

-- Create trigger to set ticket number
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.nomor_ticket IS NULL OR NEW.nomor_ticket = '' THEN
        NEW.nomor_ticket := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_consultation_ticket_number
BEFORE INSERT ON public.consultation_tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_ticket_number();

-- Add updated_at trigger
CREATE TRIGGER update_consultation_tickets_updated_at
BEFORE UPDATE ON public.consultation_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_items_updated_at
BEFORE UPDATE ON public.faq_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();