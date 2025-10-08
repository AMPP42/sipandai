-- Create table for retirement reminder message templates
CREATE TABLE IF NOT EXISTS public.retirement_reminder_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('email', 'sms', 'whatsapp')),
  subject TEXT,
  body_template TEXT NOT NULL,
  months_before_retirement INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for tracking sent reminders
CREATE TABLE IF NOT EXISTS public.retirement_reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'whatsapp')),
  template_id UUID REFERENCES public.retirement_reminder_templates(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.retirement_reminder_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retirement_reminders_sent ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Admin pusat can manage reminder templates"
ON public.retirement_reminder_templates
FOR ALL
USING (has_role(auth.uid(), 'admin_pusat'::app_role));

CREATE POLICY "Everyone can view active templates"
ON public.retirement_reminder_templates
FOR SELECT
USING (is_active = true);

-- RLS Policies for sent reminders
CREATE POLICY "Admin can view all sent reminders"
ON public.retirement_reminders_sent
FOR SELECT
USING (has_role(auth.uid(), 'admin_pusat'::app_role) OR has_role(auth.uid(), 'admin_unit'::app_role));

CREATE POLICY "System can insert reminder records"
ON public.retirement_reminders_sent
FOR INSERT
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_retirement_reminders_employee ON public.retirement_reminders_sent(employee_id);
CREATE INDEX idx_retirement_reminders_sent_at ON public.retirement_reminders_sent(sent_at);
CREATE INDEX idx_retirement_templates_type ON public.retirement_reminder_templates(template_type);
CREATE INDEX idx_retirement_templates_months ON public.retirement_reminder_templates(months_before_retirement);

-- Insert default templates
INSERT INTO public.retirement_reminder_templates (template_name, template_type, subject, body_template, months_before_retirement) VALUES
('Email Reminder 12 Bulan', 'email', 'Pemberitahuan Masa Pensiun - {{employee_name}}', 
'Kepada Yth. {{employee_name}},

Dengan hormat,

Melalui surat elektronik ini kami informasikan bahwa berdasarkan data kepegawaian, Bapak/Ibu akan memasuki masa pensiun pada tanggal {{retirement_date}}.

Data Kepegawaian:
- NIP: {{nip}}
- Nama: {{employee_name}}
- Unit Kerja: {{unit}}
- Jabatan: {{position}}
- TMT Pensiun: {{retirement_date}}

Untuk mempersiapkan administrasi pensiun, kami mohon Bapak/Ibu segera:
1. Melengkapi dokumen persyaratan pensiun
2. Mengajukan permohonan pensiun melalui sistem TEMPO
3. Menghubungi bagian kepegawaian untuk konsultasi

Dokumen yang perlu disiapkan dapat dilihat di aplikasi TEMPO pada menu Pengajuan Pensiun.

Hormat kami,
Bagian Kepegawaian', 12),

('SMS Reminder 6 Bulan', 'sms', NULL,
'[TEMPO] Kepada {{employee_name}}, masa pensiun Anda akan tiba pada {{retirement_date}}. Mohon segera lengkapi dokumen pensiun. Info: {{contact_phone}}', 6),

('WhatsApp Reminder 3 Bulan', 'whatsapp', NULL,
'*PEMBERITAHUAN MASA PENSIUN*

Kepada Yth. *{{employee_name}}*

Kami informasikan bahwa masa pensiun Bapak/Ibu akan tiba dalam 3 bulan:

📋 *Data Kepegawaian:*
• NIP: {{nip}}
• Unit: {{unit}}
• TMT Pensiun: {{retirement_date}}

⚠️ *Tindakan yang perlu dilakukan:*
1. Lengkapi dokumen persyaratan
2. Ajukan melalui sistem TEMPO
3. Konsultasi dengan kepegawaian

Akses sistem: {{app_url}}

_Pesan otomatis dari Sistem TEMPO_', 3),

('Email Reminder 6 Bulan', 'email', 'Pengingat Persiapan Pensiun - {{employee_name}}',
'Kepada Yth. {{employee_name}},

Masa pensiun Bapak/Ibu akan tiba dalam 6 bulan ({{retirement_date}}).

Mohon segera melengkapi:
✓ Dokumen persyaratan pensiun
✓ Pengajuan melalui TEMPO
✓ Koordinasi dengan bagian kepegawaian

Login: {{app_url}}

Salam,
Tim Kepegawaian', 6),

('SMS Reminder 3 Bulan', 'sms', NULL,
'[TEMPO] URGENT: {{employee_name}}, masa pensiun 3 bulan lagi ({{retirement_date}}). Segera ajukan dokumen! Info: {{contact_phone}}', 3),

('WhatsApp Reminder 1 Bulan', 'whatsapp', NULL,
'🔔 *PENGINGAT PENTING - PENSIUN*

*{{employee_name}}*

⏰ Masa pensiun *1 BULAN* lagi!
📅 TMT: *{{retirement_date}}*

*STATUS DOKUMEN:*
{{#if documents_complete}}
✅ Dokumen lengkap
{{else}}
❌ Dokumen belum lengkap
{{/if}}

Segera hubungi kepegawaian jika ada kendala.

Portal TEMPO: {{app_url}}', 1);

-- Add trigger for updated_at
CREATE TRIGGER update_retirement_reminder_templates_updated_at
  BEFORE UPDATE ON public.retirement_reminder_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();