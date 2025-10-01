import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, User, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmployeeSelector } from "@/components/appointment/EmployeeSelector";

interface AppointmentForm {
  nama_lengkap: string;
  nip: string;
  unit_kerja: string;
  email: string;
  nomor_hp: string;
  tanggal_konsultasi: Date | undefined;
  jam_konsultasi: string;
  jenis_konsultasi: string;
  keterangan: string;
}

interface Appointment {
  id: string;
  nama_lengkap: string;
  nip: string;
  unit_kerja: string;
  email: string;
  nomor_hp: string;
  tanggal_konsultasi: string;
  jam_konsultasi: string;
  jenis_konsultasi: string;
  keterangan?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  konselor_id?: string;
  catatan_admin?: string;
  created_at: string;
  updated_at: string;
}

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00"
];

export default function JadwalKonsultasi() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [jenisKonsultasi, setJenisKonsultasi] = useState<Array<{ value: string; label: string }>>([]);
  const [formData, setFormData] = useState<AppointmentForm>({
    nama_lengkap: "",
    nip: "",
    unit_kerja: "",
    email: "",
    nomor_hp: "",
    tanggal_konsultasi: undefined,
    jam_konsultasi: "",
    jenis_konsultasi: "",
    keterangan: ""
  });

  useEffect(() => {
    loadReferenceData();
    fetchAppointments();
  }, []);

  const loadReferenceData = async () => {
    try {
      // Load consultation types
      const { data: types, error } = await supabase
        .from('consultation_types')
        .select('code, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setJenisKonsultasi(types?.map(t => ({ value: t.code, label: t.name })) || []);
    } catch (error: any) {
      console.error('Error loading consultation types:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('tanggal_konsultasi', { ascending: false });

      if (error) throw error;
      setAppointments((data || []) as Appointment[]);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data appointment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Anda harus login terlebih dahulu",
          variant: "destructive"
        });
        return;
      }

      const appointmentData = {
        user_id: user.id,
        nama_lengkap: formData.nama_lengkap,
        nip: formData.nip,
        unit_kerja: formData.unit_kerja,
        email: formData.email,
        nomor_hp: formData.nomor_hp,
        tanggal_konsultasi: formData.tanggal_konsultasi?.toISOString().split('T')[0],
        jam_konsultasi: formData.jam_konsultasi,
        jenis_konsultasi: formData.jenis_konsultasi,
        keterangan: formData.keterangan || null
      };

      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: "Appointment berhasil dibuat. Anda akan mendapat konfirmasi melalui email.",
      });

      // Reset form
      setFormData({
        nama_lengkap: "",
        nip: "",
        unit_kerja: "",
        email: "",
        nomor_hp: "",
        tanggal_konsultasi: undefined,
        jam_konsultasi: "",
        jenis_konsultasi: "",
        keterangan: ""
      });

      // Refresh appointments list
      fetchAppointments();

    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Gagal membuat appointment. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Menunggu", className: "bg-yellow-100 text-yellow-700" },
      approved: { label: "Disetujui", className: "bg-green-100 text-green-700" },
      rejected: { label: "Ditolak", className: "bg-red-100 text-red-700" },
      completed: { label: "Selesai", className: "bg-blue-100 text-blue-700" },
      cancelled: { label: "Dibatalkan", className: "bg-gray-100 text-gray-700" }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-primary" />
              Jadwal Konsultasi Tatap Muka
            </h1>
            <p className="text-muted-foreground mt-2">
              Buat janji konsultasi tatap muka dengan konselor SDM untuk mendapat bantuan langsung
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Booking */}
          <Card>
            <CardHeader>
              <CardTitle>Buat Appointment Baru</CardTitle>
              <CardDescription>
                Isi form di bawah untuk membuat janji konsultasi tatap muka
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Pilih Pegawai *</Label>
                  <EmployeeSelector
                    value={formData.nip}
                    onSelect={(employee) => {
                      if (employee) {
                        setFormData({
                          ...formData,
                          nama_lengkap: employee.nama,
                          nip: employee.nip,
                          unit_kerja: employee.unit || '',
                          email: employee.email || '',
                          nomor_hp: employee.handphone || ''
                        });
                      } else {
                        setFormData({
                          ...formData,
                          nama_lengkap: '',
                          nip: '',
                          unit_kerja: '',
                          email: '',
                          nomor_hp: ''
                        });
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Pilih pegawai dari database untuk mengisi data otomatis
                  </p>
                </div>

                {formData.nip && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nama:</span>
                        <p className="font-medium">{formData.nama_lengkap}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">NIP:</span>
                        <p className="font-medium">{formData.nip}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unit:</span>
                        <p className="font-medium">{formData.unit_kerja}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{formData.email}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">No. HP:</span>
                        <p className="font-medium">{formData.nomor_hp}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Konsultasi *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.tanggal_konsultasi && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.tanggal_konsultasi ? (
                            format(formData.tanggal_konsultasi, "PPP", { locale: id })
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.tanggal_konsultasi}
                          onSelect={(date) => setFormData({...formData, tanggal_konsultasi: date})}
                          disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jam_konsultasi">Jam Konsultasi *</Label>
                    <Select
                      value={formData.jam_konsultasi}
                      onValueChange={(value) => setFormData({...formData, jam_konsultasi: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jam" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {time}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jenis_konsultasi">Jenis Konsultasi *</Label>
                  <Select
                    value={formData.jenis_konsultasi}
                    onValueChange={(value) => setFormData({...formData, jenis_konsultasi: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis konsultasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {jenisKonsultasi.map((jenis) => (
                        <SelectItem key={jenis.value} value={jenis.value}>
                          {jenis.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keterangan">Keterangan Tambahan</Label>
                  <Textarea
                    id="keterangan"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                    placeholder="Jelaskan topik yang ingin Anda konsultasikan..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Membuat Appointment..." : "Buat Appointment"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Riwayat Appointment */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Appointment Saya</CardTitle>
              <CardDescription>
                Daftar appointment yang pernah Anda buat
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Memuat data...</div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Belum ada appointment yang dibuat</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {appointments.map((appointment) => (
                    <Card key={appointment.id} className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(appointment.status)}
                            <h4 className="font-medium text-foreground">
                              {jenisKonsultasi.find(j => j.value === appointment.jenis_konsultasi)?.label}
                            </h4>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            <span>{format(new Date(appointment.tanggal_konsultasi), "PPP", { locale: id })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{appointment.jam_konsultasi}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{appointment.nama_lengkap}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{appointment.unit_kerja}</span>
                          </div>
                        </div>

                        {appointment.keterangan && (
                          <div className="mt-3 p-2 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">{appointment.keterangan}</p>
                          </div>
                        )}

                        {appointment.catatan_admin && (
                          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-700 mb-1">Catatan Admin:</p>
                            <p className="text-sm text-blue-600">{appointment.catatan_admin}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}