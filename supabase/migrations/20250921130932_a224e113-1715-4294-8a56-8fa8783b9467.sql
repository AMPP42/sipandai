-- Create chat sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create officer status table
CREATE TABLE public.officer_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create auto replies table for FAQ/chatbot
CREATE TABLE public.auto_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keywords TEXT[] NOT NULL,
  reply_text TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions
  FOR SELECT USING (user_id = auth.uid() OR officer_id = auth.uid() OR is_admin_pusat());

CREATE POLICY "Users can create their own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Officers can update assigned sessions" ON public.chat_sessions
  FOR UPDATE USING (officer_id = auth.uid() OR is_admin_pusat());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages from their sessions" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE id = chat_messages.session_id 
      AND (user_id = auth.uid() OR officer_id = auth.uid())
    ) OR is_admin_pusat()
  );

CREATE POLICY "Users can create messages in their sessions" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE id = chat_messages.session_id 
      AND (user_id = auth.uid() OR officer_id = auth.uid())
    )
  );

-- RLS Policies for officer_status
CREATE POLICY "Everyone can view officer status" ON public.officer_status
  FOR SELECT USING (true);

CREATE POLICY "Officers can update their own status" ON public.officer_status
  FOR ALL USING (officer_id = auth.uid() OR is_admin_pusat());

-- RLS Policies for auto_replies
CREATE POLICY "Everyone can view active auto replies" ON public.auto_replies
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage auto replies" ON public.auto_replies
  FOR ALL USING (is_admin_pusat());

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_officer_status_updated_at
  BEFORE UPDATE ON public.officer_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auto_replies_updated_at
  BEFORE UPDATE ON public.auto_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample auto replies
INSERT INTO public.auto_replies (keywords, reply_text, category) VALUES
  (ARRAY['mutasi', 'pindah', 'alur mutasi'], 'Untuk prosedur mutasi, silakan lihat di bagian FAQ > Mutasi. Prosedur dimulai dengan mengajukan usulan melalui TU unit masing-masing.', 'mutasi'),
  (ARRAY['kenaikan pangkat', 'KP', 'naik pangkat'], 'Untuk informasi kenaikan pangkat, silakan cek FAQ > Kenaikan Pangkat. Pengajuan dilakukan 2 bulan sebelum periode KP.', 'kenaikan_pangkat'),
  (ARRAY['pensiun', 'pension', 'bup'], 'Untuk informasi pensiun, silakan lihat FAQ > Pensiun. Persiapan dimulai 6 bulan sebelum BUP.', 'pensiun'),
  (ARRAY['hello', 'hai', 'halo', 'selamat'], 'Halo! Selamat datang di layanan konsultasi SDM. Saya siap membantu Anda. Silakan tanyakan hal yang ingin Anda konsultasikan.', 'greeting');

-- Enable realtime for chat tables
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.officer_status REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.officer_status;