import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Mail, MessageSquare, Save, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreference {
  notification_type: string;
  app_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
}

const NOTIFICATION_TYPES = [
  {
    type: 'chat',
    label: 'Pesan Chat',
    description: 'Notifikasi untuk pesan chat baru dan update status chat',
  },
  {
    type: 'application',
    label: 'Status Aplikasi',
    description: 'Notifikasi untuk update status pengajuan dan verifikasi dokumen',
  },
  {
    type: 'appointment',
    label: 'Jadwal Konsultasi',
    description: 'Pengingat jadwal konsultasi dan perubahan jadwal',
  },
  {
    type: 'info',
    label: 'Informasi Umum',
    description: 'Informasi penting dan pengumuman dari sistem',
  },
  {
    type: 'success',
    label: 'Konfirmasi Sukses',
    description: 'Notifikasi ketika aksi berhasil dilakukan',
  },
  {
    type: 'warning',
    label: 'Peringatan',
    description: 'Peringatan penting yang memerlukan perhatian',
  },
  {
    type: 'error',
    label: 'Error',
    description: 'Notifikasi untuk error atau masalah yang terjadi',
  },
];

export default function NotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Initialize preferences with defaults if not set
      const initialPrefs = NOTIFICATION_TYPES.map((type) => {
        const existing = data?.find((p) => p.notification_type === type.type);
        return existing || {
          notification_type: type.type,
          app_enabled: true,
          email_enabled: false,
          sms_enabled: false,
        };
      });

      setPreferences(initialPrefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat preferensi notifikasi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (
    type: string,
    channel: 'app_enabled' | 'email_enabled' | 'sms_enabled',
    value: boolean
  ) => {
    setPreferences((prev) =>
      prev.map((p) =>
        p.notification_type === type ? { ...p, [channel]: value } : p
      )
    );
    setHasChanges(true);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      // Upsert all preferences
      const { error } = await supabase.from('notification_preferences').upsert(
        preferences.map((p) => ({
          ...p,
          user_id: user?.id,
        })),
        {
          onConflict: 'user_id,notification_type',
        }
      );

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Preferensi notifikasi berhasil disimpan',
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan preferensi notifikasi',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Preferensi Notifikasi
        </CardTitle>
        <CardDescription>
          Kelola bagaimana Anda ingin menerima notifikasi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            Notifikasi aplikasi akan selalu aktif. Email dan SMS dapat diatur sesuai preferensi Anda.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {NOTIFICATION_TYPES.map((type) => {
            const pref = preferences.find((p) => p.notification_type === type.type);
            if (!pref) return null;

            return (
              <div key={type.type} className="space-y-4 pb-6 border-b last:border-0">
                <div>
                  <h4 className="font-medium">{type.label}</h4>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>

                <div className="space-y-3 pl-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`${type.type}-app`} className="text-sm">
                        Notifikasi Aplikasi
                      </Label>
                    </div>
                    <Switch
                      id={`${type.type}-app`}
                      checked={pref.app_enabled}
                      onCheckedChange={(value) =>
                        updatePreference(type.type, 'app_enabled', value)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`${type.type}-email`} className="text-sm">
                        Email
                      </Label>
                    </div>
                    <Switch
                      id={`${type.type}-email`}
                      checked={pref.email_enabled}
                      onCheckedChange={(value) =>
                        updatePreference(type.type, 'email_enabled', value)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`${type.type}-sms`} className="text-sm">
                        SMS
                      </Label>
                    </div>
                    <Switch
                      id={`${type.type}-sms`}
                      checked={pref.sms_enabled}
                      onCheckedChange={(value) =>
                        updatePreference(type.type, 'sms_enabled', value)
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {hasChanges && (
            <Button variant="outline" onClick={loadPreferences}>
              Batal
            </Button>
          )}
          <Button onClick={savePreferences} disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Simpan Preferensi
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
