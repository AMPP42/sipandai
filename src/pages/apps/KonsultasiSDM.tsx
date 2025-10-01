import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Ticket, Star, Clock, CheckCircle, User, Search, Send, Phone, Calendar, HelpCircle, ThumbsUp, ThumbsDown, Loader2, Plus } from "lucide-react";
import { LiveChatInterface } from '@/components/chat/LiveChatInterface';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TicketData {
  id: string;
  nomorTicket: string;
  judul: string;
  kategori: string;
  prioritas: 'rendah' | 'sedang' | 'tinggi' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  tanggalBuat: string;
  pembuatNama: string;
  pembuatUnit: string;
  konselor?: string;
  rating?: number;
  feedback?: string;
}

interface AppointmentData {
  id: string;
  tanggal_konsultasi: string;
  jam_konsultasi: string;
  nama_lengkap: string;
  nip: string;
  unit_kerja: string;
  jenis_konsultasi: string;
  status: string;
  catatan_admin?: string;
  konselor_id?: string;
}

interface FAQItem {
  id: string;
  pertanyaan: string;
  jawaban: string;
  kategori: string;
  helpful: number;
  notHelpful: number;
}

export default function KonsultasiSDM() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("faq");
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [activeTicketForChat, setActiveTicketForChat] = useState<string | null>(null);
  const [newTicket, setNewTicket] = useState({
    judul: "",
    kategori: "",
    prioritas: "",
    deskripsi: ""
  });

  useEffect(() => {
    loadTickets();
    loadFAQs();
    loadAppointments();
  }, [user?.id]);

  const loadTickets = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultation_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedTickets: TicketData[] = (data || []).map(ticket => ({
        id: ticket.id,
        nomorTicket: ticket.nomor_ticket,
        judul: ticket.judul,
        kategori: ticket.kategori,
        prioritas: ticket.prioritas as any,
        status: ticket.status as any,
        tanggalBuat: ticket.created_at,
        pembuatNama: ticket.user_name,
        pembuatUnit: ticket.user_unit,
        konselor: ticket.konselor_name || undefined,
        rating: ticket.rating || undefined,
        feedback: ticket.feedback || undefined
      }));

      setTickets(transformedTickets);
    } catch (error: any) {
      console.error('Error loading tickets:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data ticket",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const transformedFAQs: FAQItem[] = (data || []).map(faq => ({
        id: faq.id,
        pertanyaan: faq.pertanyaan,
        jawaban: faq.jawaban,
        kategori: faq.kategori,
        helpful: faq.helpful,
        notHelpful: faq.not_helpful
      }));

      setFaqs(transformedFAQs);
    } catch (error: any) {
      console.error('Error loading FAQs:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data FAQ",
        variant: "destructive"
      });
    }
  };

  const loadAppointments = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('tanggal_konsultasi', { ascending: false });

      if (error) throw error;

      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data appointment",
        variant: "destructive"
      });
    }
  };

  const handleStartChatFromTicket = (ticketId: string) => {
    setActiveTicketForChat(ticketId);
    setActiveTab("live-chat");
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !newTicket.judul || !newTicket.kategori || !newTicket.prioritas || !newTicket.deskripsi) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('consultation_tickets')
        .insert({
          judul: newTicket.judul,
          kategori: newTicket.kategori,
          prioritas: newTicket.prioritas,
          deskripsi: newTicket.deskripsi,
          user_id: user.id,
          user_name: user.name || 'User',
          user_unit: user.unit || '-',
          nomor_ticket: '' // Will be auto-generated by trigger
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Ticket konsultasi berhasil dibuat"
      });

      // Reset form
      setNewTicket({
        judul: "",
        kategori: "",
        prioritas: "",
        deskripsi: ""
      });

      // Reload tickets
      await loadTickets();

      // Switch to my tickets tab
      setActiveTab("my-tickets");
    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat ticket",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFAQVote = async (faqId: string, isHelpful: boolean) => {
    try {
      const faq = faqs.find(f => f.id === faqId);
      if (!faq) return;

      const { error } = await supabase
        .from('faq_items')
        .update({
          helpful: isHelpful ? faq.helpful + 1 : faq.helpful,
          not_helpful: !isHelpful ? faq.notHelpful + 1 : faq.notHelpful
        })
        .eq('id', faqId);

      if (error) throw error;

      // Reload FAQs to show updated counts
      await loadFAQs();

      toast({
        title: "Terima kasih",
        description: "Feedback Anda telah tersimpan"
      });
    } catch (error: any) {
      console.error('Error voting FAQ:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      open: { label: "Buka", className: "bg-blue-100 text-blue-700" },
      in_progress: { label: "Sedang Diproses", className: "bg-yellow-100 text-yellow-700" },
      resolved: { label: "Selesai", className: "bg-green-100 text-green-700" },
      closed: { label: "Ditutup", className: "bg-gray-100 text-gray-700" }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.open;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (prioritas: string) => {
    const priorityMap = {
      rendah: { label: "Rendah", className: "bg-green-100 text-green-700" },
      sedang: { label: "Sedang", className: "bg-yellow-100 text-yellow-700" },
      tinggi: { label: "Tinggi", className: "bg-orange-100 text-orange-700" },
      urgent: { label: "Urgent", className: "bg-red-100 text-red-700" }
    };
    
    const priorityInfo = priorityMap[prioritas as keyof typeof priorityMap] || priorityMap.rendah;
    return <Badge className={priorityInfo.className}>{priorityInfo.label}</Badge>;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
    ));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              Panduan Layanan Mutasi, Kenaikan Pangkat, & Pensiun
            </h1>
            <p className="text-muted-foreground mt-2">Ticketing system, layanan konsultasi, dan panduan terkait layanan kepegawaian</p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-blue-100 text-blue-700">
              {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length} Aktif
            </Badge>
            <Badge className="bg-green-100 text-green-700">
              {tickets.filter(t => t.status === 'resolved').length} Selesai
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="ticket" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Buat Ticket
            </TabsTrigger>
            <TabsTrigger value="my-tickets" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Ticket Saya
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQ & Panduan
            </TabsTrigger>
            <TabsTrigger value="live-chat" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Live Chat
            </TabsTrigger>
            <TabsTrigger value="appointment" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Jadwal Konsultasi
            </TabsTrigger>
            <TabsTrigger value="my-appointments" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Jadwal Saya
            </TabsTrigger>
          </TabsList>

          {/* Tab: Create Ticket */}
          <TabsContent value="ticket" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Buat Ticket Konsultasi Baru</CardTitle>
                <CardDescription>
                  Ajukan pertanyaan atau masalah kepegawaian yang memerlukan konsultasi dengan tim SDM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTicket} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="judul">Judul Konsultasi</Label>
                      <Input
                        id="judul"
                        placeholder="Misal: Konsultasi Prosedur Kenaikan Pangkat"
                        value={newTicket.judul}
                        onChange={(e) => setNewTicket({ ...newTicket, judul: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kategori">Kategori</Label>
                      <Select
                        value={newTicket.kategori}
                        onValueChange={(value) => setNewTicket({ ...newTicket, kategori: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mutasi">Mutasi</SelectItem>
                          <SelectItem value="Kenaikan Pangkat">Kenaikan Pangkat</SelectItem>
                          <SelectItem value="Pensiun">Pensiun</SelectItem>
                          <SelectItem value="Cuti & Izin">Cuti & Izin</SelectItem>
                          <SelectItem value="Kepangkatan">Kepangkatan</SelectItem>
                          <SelectItem value="Lainnya">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prioritas">Prioritas</Label>
                      <Select
                        value={newTicket.prioritas}
                        onValueChange={(value) => setNewTicket({ ...newTicket, prioritas: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih prioritas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rendah">Rendah</SelectItem>
                          <SelectItem value="sedang">Sedang</SelectItem>
                          <SelectItem value="tinggi">Tinggi</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deskripsi">Deskripsi Masalah</Label>
                    <Textarea
                      id="deskripsi"
                      placeholder="Jelaskan pertanyaan atau masalah yang ingin dikonsultasikan..."
                      rows={6}
                      value={newTicket.deskripsi}
                      onChange={(e) => setNewTicket({ ...newTicket, deskripsi: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Kirim Ticket
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: My Tickets */}
          <TabsContent value="my-tickets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Ticket Konsultasi Saya</CardTitle>
                <CardDescription>
                  Pantau status dan progress ticket konsultasi yang telah diajukan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belum Ada Ticket</h3>
                    <p className="text-muted-foreground mb-4">
                      Anda belum pernah membuat ticket konsultasi
                    </p>
                    <Button onClick={() => setActiveTab("ticket")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Buat Ticket Baru
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <Card key={ticket.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg">{ticket.judul}</h3>
                                {getStatusBadge(ticket.status)}
                                {getPriorityBadge(ticket.prioritas)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Ticket #{ticket.nomorTicket} • Dibuat pada {new Date(ticket.tanggalBuat).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Kategori:</span>{" "}
                              <span className="font-medium">{ticket.kategori}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Unit:</span>{" "}
                              <span className="font-medium">{ticket.pembuatUnit}</span>
                            </div>
                            {ticket.konselor && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Konselor:</span>{" "}
                                <span className="font-medium">{ticket.konselor}</span>
                              </div>
                            )}
                          </div>

                          {ticket.rating && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Rating:</span>
                                <div className="flex gap-1">
                                  {renderStars(ticket.rating)}
                                </div>
                              </div>
                              {ticket.feedback && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  "{ticket.feedback}"
                                </p>
                              )}
                            </div>
                          )}

                          {ticket.status === 'in_progress' && (
                            <div className="mt-4">
                              <Button 
                                onClick={() => handleStartChatFromTicket(ticket.id)}
                                className="w-full"
                              >
                                <Phone className="w-4 h-4 mr-2" />
                                Mulai Live Chat
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: FAQ */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions (FAQ)</CardTitle>
                <CardDescription>
                  Panduan lengkap dan pertanyaan umum seputar layanan kepegawaian
                </CardDescription>
              </CardHeader>
              <CardContent>
                {faqs.length === 0 ? (
                  <div className="text-center py-12">
                    <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belum Ada FAQ</h3>
                    <p className="text-muted-foreground">
                      FAQ akan segera ditambahkan
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="border rounded-lg p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge className="mb-2">{faq.kategori}</Badge>
                            <h3 className="font-semibold text-lg">{faq.pertanyaan}</h3>
                          </div>
                        </div>
                        
                        <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                          {faq.jawaban}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{faq.helpful} membantu</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsDown className="w-4 h-4" />
                              <span>{faq.notHelpful} tidak membantu</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFAQVote(faq.id, true)}
                            >
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              Membantu
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFAQVote(faq.id, false)}
                            >
                              <ThumbsDown className="w-4 h-4 mr-1" />
                              Tidak Membantu
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Live Chat */}
          <TabsContent value="live-chat">
            <LiveChatInterface ticketId={activeTicketForChat} />
          </TabsContent>

          {/* Tab: Appointment */}
          <TabsContent value="appointment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Jadwal Konsultasi</CardTitle>
                <CardDescription>
                  Jadwalkan konsultasi langsung dengan tim SDM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Butuh Konsultasi Langsung?</h3>
                  <p className="text-muted-foreground mb-4">
                    Jadwalkan pertemuan konsultasi dengan tim SDM kami
                  </p>
                  <Button onClick={() => navigate('/apps/jadwal-konsultasi')}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Buat Jadwal Konsultasi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: My Appointments */}
          <TabsContent value="my-appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Jadwal Konsultasi Saya</CardTitle>
                <CardDescription>
                  Pantau status jadwal konsultasi yang telah diajukan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belum Ada Jadwal</h3>
                    <p className="text-muted-foreground mb-4">
                      Anda belum pernah mengajukan jadwal konsultasi
                    </p>
                    <Button onClick={() => navigate('/apps/jadwal-konsultasi')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Buat Jadwal Baru
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => {
                      const statusMap: Record<string, { label: string; className: string }> = {
                        pending: { label: "Menunggu", className: "bg-yellow-100 text-yellow-700" },
                        approved: { label: "Disetujui", className: "bg-green-100 text-green-700" },
                        rejected: { label: "Ditolak", className: "bg-red-100 text-red-700" },
                        completed: { label: "Selesai", className: "bg-gray-100 text-gray-700" }
                      };
                      const status = statusMap[appointment.status] || statusMap.pending;
                      
                      return (
                        <Card key={appointment.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-lg">{appointment.jenis_konsultasi}</h3>
                                  <Badge className={status.className}>{status.label}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(appointment.tanggal_konsultasi).toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })} • {appointment.jam_konsultasi}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Nama:</span>{" "}
                                <span className="font-medium">{appointment.nama_lengkap}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">NIP:</span>{" "}
                                <span className="font-medium">{appointment.nip}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Unit:</span>{" "}
                                <span className="font-medium">{appointment.unit_kerja}</span>
                              </div>
                            </div>

                            {appointment.catatan_admin && (
                              <div className="mt-4 pt-4 border-t">
                                <span className="text-sm text-muted-foreground font-medium">Catatan Admin:</span>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {appointment.catatan_admin}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}