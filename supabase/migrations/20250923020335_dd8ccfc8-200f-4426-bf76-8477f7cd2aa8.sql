-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nama_lengkap TEXT NOT NULL,
  nip TEXT NOT NULL,
  unit_kerja TEXT NOT NULL,
  email TEXT NOT NULL,
  nomor_hp TEXT NOT NULL,
  tanggal_konsultasi DATE NOT NULL,
  jam_konsultasi TIME NOT NULL,
  jenis_konsultasi TEXT NOT NULL CHECK (jenis_konsultasi IN ('mutasi', 'kenaikan_pangkat', 'pensiun', 'lainnya')),
  keterangan TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  konselor_id UUID,
  catatan_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Users can create their own appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending appointments" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admin pusat can view all appointments" 
ON public.appointments 
FOR SELECT 
USING (is_admin_pusat());

CREATE POLICY "Admin pusat can update all appointments" 
ON public.appointments 
FOR UPDATE 
USING (is_admin_pusat());

CREATE POLICY "Counselors can view their assigned appointments" 
ON public.appointments 
FOR SELECT 
USING (konselor_id = auth.uid());

CREATE POLICY "Counselors can update their assigned appointments" 
ON public.appointments 
FOR UPDATE 
USING (konselor_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create appointment_notifications table for tracking notifications
CREATE TABLE public.appointment_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking_confirmation', 'status_update', 'reminder')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.appointment_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment notifications
CREATE POLICY "Users can view their own notifications" 
ON public.appointment_notifications 
FOR SELECT 
USING (recipient_id = auth.uid());

CREATE POLICY "Admin can manage all notifications" 
ON public.appointment_notifications 
FOR ALL 
USING (is_admin_pusat());

-- Enable realtime for appointments
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.appointments;

-- Enable realtime for appointment notifications
ALTER TABLE public.appointment_notifications REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.appointment_notifications;