import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Mail, MessageSquare, Phone, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Template {
  id: string;
  template_name: string;
  template_type: 'email' | 'sms' | 'whatsapp';
  subject: string | null;
  body_template: string;
  months_before_retirement: number;
  is_active: boolean;
}

export default function ManageReminderTemplates() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    template_name: '',
    subject: '',
    body_template: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('retirement_reminder_templates')
        .select('*')
        .order('months_before_retirement', { ascending: false })
        .order('template_type');

      if (error) throw error;
      setTemplates((data || []) as Template[]);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat template',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      subject: template.subject || '',
      body_template: template.body_template,
    });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      const { error } = await supabase
        .from('retirement_reminder_templates')
        .update({
          template_name: formData.template_name,
          subject: formData.subject || null,
          body_template: formData.body_template,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Template berhasil diperbarui',
      });

      setEditingTemplate(null);
      loadTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan template',
        variant: 'destructive'
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <Phone className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return null;
    }
  };

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
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Kelola Template Reminder Pensiun</h1>
          <p className="text-muted-foreground">
            Edit template pesan reminder yang akan dikirim kepada pegawai
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedTemplates)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([months, monthTemplates]) => (
            <Card key={months}>
              <CardHeader>
                <CardTitle>Reminder {months} Bulan Sebelum Pensiun</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {monthTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getIcon(template.template_type)}
                        <span className="font-medium">{template.template_name}</span>
                        <Badge variant="outline">
                          {template.template_type.toUpperCase()}
                        </Badge>
                        {!template.is_active && (
                          <Badge variant="secondary">Nonaktif</Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>

                    {template.subject && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Subject:</Label>
                        <p className="text-sm">{template.subject}</p>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs text-muted-foreground">Template Pesan:</Label>
                      <p className="text-sm whitespace-pre-wrap line-clamp-3">
                        {template.body_template}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
      </div>

      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template: {editingTemplate?.template_name}</DialogTitle>
            <DialogDescription>
              Edit template pesan reminder. Gunakan variabel: {'{{employee_name}}'}, {'{{nip}}'}, {'{{unit}}'}, {'{{position}}'}, {'{{retirement_date}}'}, {'{{app_url}}'}, {'{{contact_phone}}'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="template_name">Nama Template</Label>
              <Input
                id="template_name"
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
              />
            </div>

            {editingTemplate?.template_type === 'email' && (
              <div>
                <Label htmlFor="subject">Subject Email</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Subject email..."
                />
              </div>
            )}

            <div>
              <Label htmlFor="body_template">Template Pesan</Label>
              <Textarea
                id="body_template"
                value={formData.body_template}
                onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-semibold mb-2 block">Preview:</Label>
              <div className="text-sm whitespace-pre-wrap">
                {formData.body_template}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Batal
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
