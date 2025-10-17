import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, MessageSquare, Phone, Loader2, Send, CheckCircle2, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Employee {
  id: string;
  nama: string;
  nip: string | null;
  email: string | null;
  handphone: string | null;
  unit: string | null;
  jabatan: string | null;
  tmt_pensiun: string | null;
  tanggal_lahir: string | null;
}

interface Template {
  id: string;
  template_name: string;
  template_type: 'email' | 'sms' | 'whatsapp';
  subject: string | null;
  body_template: string;
  months_before_retirement: number;
}

export default function KirimReminderPensiun() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [channels, setChannels] = useState({
    email: false,
    sms: false,
    whatsapp: false,
  });

  useEffect(() => {
    loadEmployee();
    loadTemplates();
  }, [employeeId]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('id, nama, nip, email, handphone, unit, jabatan, tmt_pensiun, tanggal_lahir')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      setEmployee(data);
    } catch (error: any) {
      console.error('Error loading employee:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data pegawai',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('retirement_reminder_templates')
        .select('*')
        .eq('is_active', true)
        .order('months_before_retirement', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as Template[]);
      
      // Auto select first template if available
      if (data && data.length > 0) {
        setSelectedTemplate(data[0].id);
      }
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat template reminder',
        variant: 'destructive'
      });
    }
  };

  const handleSendReminder = async () => {
    if (!selectedTemplate) {
      toast({
        title: 'Error',
        description: 'Pilih template reminder terlebih dahulu',
        variant: 'destructive'
      });
      return;
    }

    const selectedChannels = Object.entries(channels)
      .filter(([_, enabled]) => enabled)
      .map(([channel]) => channel);

    if (selectedChannels.length === 0) {
      toast({
        title: 'Error',
        description: 'Pilih minimal satu channel pengiriman',
        variant: 'destructive'
      });
      return;
    }

    // Validasi kontak pegawai
    if (channels.email && !employee?.email) {
      toast({
        title: 'Error',
        description: 'Email pegawai tidak tersedia',
        variant: 'destructive'
      });
      return;
    }

    if ((channels.sms || channels.whatsapp) && !employee?.handphone) {
      toast({
        title: 'Error',
        description: 'Nomor handphone pegawai tidak tersedia',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    const results: { channel: string; success: boolean; error?: string }[] = [];

    try {
      // Send Email
      if (channels.email) {
        try {
          const { error } = await supabase.functions.invoke('send-retirement-reminder-email', {
            body: {
              employeeId: employee?.id,
              templateId: selectedTemplate
            }
          });

          if (error) throw error;
          results.push({ channel: 'Email', success: true });
        } catch (error: any) {
          console.error('Email error:', error);
          results.push({ channel: 'Email', success: false, error: error.message });
        }
      }

      // Send SMS
      if (channels.sms) {
        try {
          const { error } = await supabase.functions.invoke('send-retirement-reminder-sms', {
            body: {
              employeeId: employee?.id,
              templateId: selectedTemplate
            }
          });

          if (error) throw error;
          results.push({ channel: 'SMS', success: true });
        } catch (error: any) {
          console.error('SMS error:', error);
          results.push({ channel: 'SMS', success: false, error: error.message });
        }
      }

      // Send WhatsApp
      if (channels.whatsapp) {
        try {
          const { error } = await supabase.functions.invoke('send-retirement-reminder-whatsapp', {
            body: {
              employeeId: employee?.id,
              templateId: selectedTemplate
            }
          });

          if (error) throw error;
          results.push({ channel: 'WhatsApp', success: true });
        } catch (error: any) {
          console.error('WhatsApp error:', error);
          results.push({ channel: 'WhatsApp', success: false, error: error.message });
        }
      }

      // Show results
      const successCount = results.filter(r => r.success).length;
      const failedResults = results.filter(r => !r.success);

      if (successCount > 0) {
        toast({
          title: 'Berhasil',
          description: `Reminder berhasil dikirim melalui ${successCount} channel`,
        });
      }

      if (failedResults.length > 0) {
        failedResults.forEach(({ channel, error }) => {
          toast({
            title: `Gagal mengirim ${channel}`,
            description: error || 'Terjadi kesalahan',
            variant: 'destructive'
          });
        });
      }

      if (successCount === results.length) {
        // All successful, navigate back
        setTimeout(() => {
          navigate('/apps/pensiun?tab=reminder');
        }, 1500);
      }

    } catch (error: any) {
      console.error('Error sending reminders:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengirim reminder',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertDescription>Data pegawai tidak ditemukan</AlertDescription>
        </Alert>
      </div>
    );
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    const months = template.months_before_retirement;
    if (!acc[months]) {
      acc[months] = [];
    }
    acc[months].push(template);
    return acc;
  }, {} as Record<number, Template[]>);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/apps/pensiun?tab=reminder')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Kirim Reminder Pensiun</h1>
          <p className="text-muted-foreground">
            Kirim notifikasi reminder pensiun melalui Email, SMS, atau WhatsApp
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Employee Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pegawai</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Nama</Label>
              <p className="font-medium">{employee.nama}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">NIP</Label>
              <p className="font-medium">{employee.nip || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Unit</Label>
              <p className="font-medium">{employee.unit || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Jabatan</Label>
              <p className="font-medium">{employee.jabatan || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">TMT Pensiun</Label>
              <p className="font-medium">
                {employee.tmt_pensiun 
                  ? new Date(employee.tmt_pensiun).toLocaleDateString('id-ID')
                  : '-'}
              </p>
            </div>
            
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{employee.email || 'Email tidak tersedia'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{employee.handphone || 'Nomor HP tidak tersedia'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Pilih Channel Pengiriman</CardTitle>
            <CardDescription>Pilih satu atau lebih channel untuk mengirim reminder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="email" 
                checked={channels.email}
                onCheckedChange={(checked) => setChannels(prev => ({ ...prev, email: !!checked }))}
                disabled={!employee.email}
              />
              <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                <Mail className="w-4 h-4" />
                Email
                {!employee.email && <Badge variant="secondary" className="ml-2">Tidak tersedia</Badge>}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sms" 
                checked={channels.sms}
                onCheckedChange={(checked) => setChannels(prev => ({ ...prev, sms: !!checked }))}
                disabled={!employee.handphone}
              />
              <Label htmlFor="sms" className="flex items-center gap-2 cursor-pointer">
                <MessageSquare className="w-4 h-4" />
                SMS
                {!employee.handphone && <Badge variant="secondary" className="ml-2">Tidak tersedia</Badge>}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="whatsapp" 
                checked={channels.whatsapp}
                onCheckedChange={(checked) => setChannels(prev => ({ ...prev, whatsapp: !!checked }))}
                disabled={!employee.handphone}
              />
              <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer">
                <MessageSquare className="w-4 h-4" />
                WhatsApp
                {!employee.handphone && <Badge variant="secondary" className="ml-2">Tidak tersedia</Badge>}
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pilih Template Reminder</CardTitle>
              <CardDescription>
                Pilih template pesan yang akan dikirim kepada pegawai
              </CardDescription>
            </div>
            <Link to="/apps/manage-reminder-templates">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Kelola Template
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <div className="space-y-4">
              {Object.entries(groupedTemplates)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([months, monthTemplates]) => (
                  <div key={months} className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      Reminder {months} Bulan Sebelum Pensiun
                    </h3>
                    {monthTemplates.map((template) => {
                      const Icon = template.template_type === 'email' ? Mail : template.template_type === 'sms' ? Phone : MessageSquare;
                      return (
                        <div key={template.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                          <Icon className="w-5 h-5 mt-1 text-muted-foreground" />
                          <Label htmlFor={template.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{template.template_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {template.template_type.toUpperCase()}
                              </Badge>
                            </div>
                            {template.subject && (
                              <p className="text-sm font-medium text-foreground mb-1">
                                Subject: {template.subject}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                              {template.body_template.substring(0, 200)}...
                            </p>
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          </RadioGroup>

          {templates.length === 0 && (
            <Alert>
              <AlertDescription>
                Belum ada template reminder yang tersedia. Hubungi administrator untuk menambahkan template.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/apps/pensiun?tab=reminder')}
        >
          Batal
        </Button>
        <Button
          onClick={handleSendReminder}
          disabled={sending || !selectedTemplate || Object.values(channels).every(v => !v)}
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mengirim...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Kirim Reminder
            </>
          )}
        </Button>
      </div>
    </div>
  );
}