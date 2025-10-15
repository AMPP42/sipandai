import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { notifyUserOnAppointmentUpdate } from '@/lib/notifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function AdminAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updateData, setUpdateData] = useState({
    status: "",
    catatan_admin: "",
    konselor_id: ""
  });

  useEffect(() => {
    loadAppointments();
    
    // Real-time subscription
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => loadAppointments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, statusFilter, searchQuery]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('tanggal_konsultasi', { ascending: false });

      if (error) throw error;
      setAppointments((data || []) as Appointment[]);
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data appointment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.unit_kerja.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.jenis_konsultasi.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleOpenDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setUpdateData({
      status: appointment.status,
      catatan_admin: appointment.catatan_admin || "",
      konselor_id: appointment.konselor_id || user?.id || ""
    });
    setShowDetailDialog(true);
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: updateData.status,
          catatan_admin: updateData.catatan_admin || null,
          konselor_id: updateData.konselor_id || null
        })
        .eq('id', selectedAppointment.id)
        .select('user_id')
        .single();

      if (error) throw error;

      // Notify user about appointment status change
      if (data?.user_id && updateData.status !== selectedAppointment.status) {
        const appointmentDetails = `${selectedAppointment.jenis_konsultasi} - ${format(new Date(selectedAppointment.tanggal_konsultasi), 'dd MMM yyyy', { locale: id })} ${selectedAppointment.jam_konsultasi}`;
        await notifyUserOnAppointmentUpdate(
          data.user_id,
          appointmentDetails,
          updateData.status,
          updateData.catatan_admin
        );
      }

      toast({
        title: "Berhasil",
        description: "Appointment berhasil diperbarui dan notifikasi telah dikirim"
      });

      setShowDetailDialog(false);
      loadAppointments();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui appointment",
        variant: "destructive"
      });
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

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    approved: appointments.filter(a => a.status === 'approved').length,
    completed: appointments.filter(a => a.status === 'completed').length
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Menunggu</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disetujui</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selesai</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Appointment</CardTitle>
          <CardDescription>Kelola semua appointment konsultasi tatap muka</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pegawai, NIP, atau unit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Appointments List */}
          {loading ? (
            <div className="text-center py-8">Memuat data...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Tidak ada appointment yang ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="border border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(appointment.status)}
                        <div>
                          <h4 className="font-medium text-foreground">{appointment.nama_lengkap}</h4>
                          <p className="text-sm text-muted-foreground">{appointment.nip}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(appointment.status)}
                        <Button size="sm" onClick={() => handleOpenDetail(appointment)}>
                          Detail
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{format(new Date(appointment.tanggal_konsultasi), "PPP", { locale: id })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{appointment.jam_konsultasi}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{appointment.unit_kerja}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{appointment.jenis_konsultasi}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Appointment</DialogTitle>
            <DialogDescription>
              Kelola status dan informasi appointment
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              {/* Appointment Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Nama Pegawai</Label>
                  <p className="font-medium">{selectedAppointment.nama_lengkap}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">NIP</Label>
                  <p className="font-medium">{selectedAppointment.nip}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Unit Kerja</Label>
                  <p className="font-medium">{selectedAppointment.unit_kerja}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedAppointment.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Nomor HP</Label>
                  <p className="font-medium">{selectedAppointment.nomor_hp}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Jenis Konsultasi</Label>
                  <p className="font-medium">{selectedAppointment.jenis_konsultasi}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tanggal</Label>
                  <p className="font-medium">
                    {format(new Date(selectedAppointment.tanggal_konsultasi), "PPP", { locale: id })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Jam</Label>
                  <p className="font-medium">{selectedAppointment.jam_konsultasi}</p>
                </div>
              </div>

              {selectedAppointment.keterangan && (
                <div>
                  <Label>Keterangan</Label>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg mt-1">
                    {selectedAppointment.keterangan}
                  </p>
                </div>
              )}

              {/* Update Form */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="status">Status Appointment</Label>
                  <Select
                    value={updateData.status}
                    onValueChange={(value) => setUpdateData({ ...updateData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Menunggu</SelectItem>
                      <SelectItem value="approved">Disetujui</SelectItem>
                      <SelectItem value="rejected">Ditolak</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="catatan_admin">Catatan Admin</Label>
                  <Textarea
                    id="catatan_admin"
                    value={updateData.catatan_admin}
                    onChange={(e) => setUpdateData({ ...updateData, catatan_admin: e.target.value })}
                    placeholder="Tambahkan catatan untuk pegawai..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateAppointment}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}