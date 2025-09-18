import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Ticket, Star, Clock, CheckCircle, User, Search, Send, Phone, Calendar, HelpCircle, ThumbsUp, ThumbsDown } from "lucide-react";
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
interface FAQItem {
  id: string;
  pertanyaan: string;
  jawaban: string;
  kategori: string;
  helpful: number;
  notHelpful: number;
}
export default function KonsultasiSDM() {
  const [activeTab, setActiveTab] = useState("ticket");
  const [newTicket, setNewTicket] = useState({
    judul: "",
    kategori: "",
    prioritas: "",
    deskripsi: ""
  });

  // Mock data for demonstration
  const ticketData: TicketData[] = [{
    id: "1",
    nomorTicket: "TKT/2024/0001",
    judul: "Konsultasi Prosedur Kenaikan Pangkat",
    kategori: "Kepangkatan",
    prioritas: "sedang",
    status: "in_progress",
    tanggalBuat: "2024-01-15",
    pembuatNama: "Ahmad Fauzi",
    pembuatUnit: "Biro Hukum",
    konselor: "Dr. Siti Aminah, M.M."
  }, {
    id: "2",
    nomorTicket: "TKT/2024/0002",
    judul: "Pertanyaan tentang Cuti Sakit",
    kategori: "Cuti & Izin",
    prioritas: "rendah",
    status: "resolved",
    tanggalBuat: "2024-01-10",
    pembuatNama: "Budi Santoso",
    pembuatUnit: "Inspektorat",
    konselor: "Drs. Agus Wijaya",
    rating: 5,
    feedback: "Sangat membantu dan responsif"
  }];
  const faqData: FAQItem[] = [{
    id: "1",
    pertanyaan: "Bagaimana prosedur pengajuan cuti tahunan?",
    jawaban: "Untuk mengajukan cuti tahunan, Anda perlu: 1) Mengisi formulir permohonan cuti, 2) Mendapat persetujuan atasan langsung, 3) Menyerahkan ke bagian kepegawaian minimal 7 hari sebelum pelaksanaan cuti.",
    kategori: "Cuti & Izin",
    helpful: 25,
    notHelpful: 2
  }, {
    id: "2",
    pertanyaan: "Apa syarat untuk kenaikan pangkat regular?",
    jawaban: "Syarat kenaikan pangkat regular: 1) Telah menempati pangkat sekarang minimal 4 tahun, 2) Memiliki DP3/SKP minimal baik, 3) Memenuhi persyaratan pendidikan dan diklat yang diperlukan, 4) Tidak sedang menjalani hukuman disiplin.",
    kategori: "Kepangkatan",
    helpful: 40,
    notHelpful: 1
  }, {
    id: "3",
    pertanyaan: "Alur dan Prosedur Pengajuan Mutasi",
    jawaban: "1. Pegawai mengajukan permohonan mutasi ke TU dengan sepengetahuan Kepala Unit asal.\n2. TU unit asal memeriksa ketersediaan formasi (pegawai berkoordinasi dengan unit tujuan).\n3. Kepala Unit asal mengajukan Nota Dinas permohonan mutasi ke Sesditjen.\n4. Jika disetujui, pegawai melengkapi berkas ke TU.\n5. TU mengirimkan berkas ke SDMA Setditjen.\n6. SDMA memeriksa berkas, lalu mengajukan surat bebas temuan ke Inspektorat Jenderal dan surat bezetting yang ditandatangani Sesditjen.\n7. SDMA mengajukan berkas lengkap ke Biro.\n8. Menunggu persetujuan mutasi.\n   • Jika ditolak → berkas dikembalikan ke TU unit asal beserta dengan alasan\n   • Jika disetujui tetapi ada kekurangan → pegawai wajib melengkapi terlebih dahulu.",
    kategori: "Mutasi",
    helpful: 35,
    notHelpful: 1
  }, {
    id: "4",
    pertanyaan: "Persyaratan yang Dibutuhkan untuk Mutasi",
    jawaban: "• Surat Pernyataan Lolos Butuh dari PPK Instansi Asal (Asli)\n• Surat Keterangan Tidak Sedang Menjalani Hukuman Disiplin (Asli)\n• Surat Keterangan Tidak Sedang Menjalani Tugas Belajar/Ikatan Dinas (Asli)\n• Surat Keterangan Tidak Mempunyai Hutang Piutang dengan Pihak Bank (Asli)\n• Surat Pernyataan Bebas Temuan yang Diterbitkan oleh ITJEN (Asli)\n• ANJAB dan ABK yang ditandatangani oleh PPK Instansi Asal (Bila Pindah Antar Kementerian)\n• SK CPNS (Fotokopi legalisir)\n• SK PNS (Fotokopi legalisir)\n• SK Pangkat Terakhir (Fotokopi legalisir)\n• SK Jabatan Terakhir (Fotokopi legalisir)\n• KARPEG (Fotokopi legalisir)\n• Ijazah dan Transkrip Nilai Universitas (Fotokopi legalisir)\n• SKP 2 tahun terakhir (Fotokopi legalisir)\n• Surat permohonan mutasi dari ybs\n• Daftar Riwayat Hidup (DRH) sesuai Keputusan Kepala BKN Nomor 11 Tahun 2002",
    kategori: "Mutasi",
    helpful: 42,
    notHelpful: 0
  }, {
    id: "5",
    pertanyaan: "Siapa saja yang bisa mengajukan mutasi?",
    jawaban: "Semua PNS yang memenuhi syarat administrasi dan kebutuhan formasi dapat mengajukan mutasi dengan persetujuan atasan dan Kepala Unit asal.",
    kategori: "Mutasi",
    helpful: 28,
    notHelpful: 2
  }, {
    id: "6",
    pertanyaan: "Apakah mutasi bisa dilakukan tanpa ketersediaan formasi di unit tujuan?",
    jawaban: "Tidak. Mutasi hanya dapat dilakukan jika ada formasi di unit tujuan.",
    kategori: "Mutasi",
    helpful: 31,
    notHelpful: 1
  }, {
    id: "7",
    pertanyaan: "Berapa lama proses mutasi pegawai?",
    jawaban: "Waktu bervariasi. Namun, rata-rata 1-3 bulan, tergantung kelengkapan berkas, proses verifikasi, dan persetujuan dari pejabat berwenang.",
    kategori: "Mutasi",
    helpful: 33,
    notHelpful: 0
  }, {
    id: "8",
    pertanyaan: "Apa yang terjadi jika permohonan mutasi ditolak?",
    jawaban: "Berkas akan dikembalikan ke TU unit asal dengan alasan tertulis. Pegawai dapat memperbaiki atau mengajukan kembali sesuai ketentuan.",
    kategori: "Mutasi",
    helpful: 26,
    notHelpful: 1
  }, {
    id: "9",
    pertanyaan: "Jika mutasi disetujui tetapi berkas kurang lengkap, apa yang harus dilakukan?",
    jawaban: "Pegawai wajib melengkapi berkas terlebih dahulu sebelum usulan diproses lebih lanjut.",
    kategori: "Mutasi",
    helpful: 29,
    notHelpful: 0
  }, {
    id: "10",
    pertanyaan: "Apakah pegawai boleh mengajukan mutasi antar instansi (misalnya antar kementerian/lembaga atau ke pemerintah daerah)?",
    jawaban: "Boleh, sepanjang memenuhi syarat, tersedia formasi di instansi tujuan, dan mendapat persetujuan dari kedua instansi serta BKN.",
    kategori: "Mutasi",
    helpful: 24,
    notHelpful: 2
  }];
  const getStatusBadge = (status: string) => {
    const statusMap = {
      open: {
        label: "Buka",
        className: "bg-blue-100 text-blue-700"
      },
      in_progress: {
        label: "Sedang Diproses",
        className: "bg-yellow-100 text-yellow-700"
      },
      resolved: {
        label: "Selesai",
        className: "bg-green-100 text-green-700"
      },
      closed: {
        label: "Ditutup",
        className: "bg-gray-100 text-gray-700"
      }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.open;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };
  const getPriorityBadge = (prioritas: string) => {
    const priorityMap = {
      rendah: {
        label: "Rendah",
        className: "bg-green-100 text-green-700"
      },
      sedang: {
        label: "Sedang",
        className: "bg-yellow-100 text-yellow-700"
      },
      tinggi: {
        label: "Tinggi",
        className: "bg-orange-100 text-orange-700"
      },
      urgent: {
        label: "Urgent",
        className: "bg-red-100 text-red-700"
      }
    };
    const priorityInfo = priorityMap[prioritas as keyof typeof priorityMap] || priorityMap.rendah;
    return <Badge className={priorityInfo.className}>{priorityInfo.label}</Badge>;
  };
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement ticket submission
    console.log("New ticket:", newTicket);
    // Reset form
    setNewTicket({
      judul: "",
      kategori: "",
      prioritas: "",
      deskripsi: ""
    });
  };
  const renderStars = (rating: number) => {
    return Array.from({
      length: 5
    }, (_, i) => <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />);
  };
  return <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              Panduan Layanan Kepegawaian
            </h1>
            <p className="text-muted-foreground mt-2">Ticketing system, layanan konsultasi, dan panduan terkait layanan kepegawaian</p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-blue-100 text-blue-700">
              {ticketData.filter(t => t.status === 'open' || t.status === 'in_progress').length} Aktif
            </Badge>
            <Badge className="bg-green-100 text-green-700">
              {ticketData.filter(t => t.status === 'resolved').length} Selesai
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
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
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="judul">Judul Konsultasi *</Label>
                        <Input id="judul" value={newTicket.judul} onChange={e => setNewTicket({
                        ...newTicket,
                        judul: e.target.value
                      })} placeholder="Jelaskan topik konsultasi Anda..." required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="kategori">Kategori *</Label>
                        <Select value={newTicket.kategori} onValueChange={value => setNewTicket({
                        ...newTicket,
                        kategori: value
                      })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori konsultasi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mutasi">Mutasi</SelectItem>
                            <SelectItem value="kenaikan-pangkat">Kenaikan Pangkat</SelectItem>
                            <SelectItem value="pensiun">Pensiun</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="prioritas">Tingkat Prioritas *</Label>
                        <Select value={newTicket.prioritas} onValueChange={value => setNewTicket({
                        ...newTicket,
                        prioritas: value
                      })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tingkat prioritas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rendah">Rendah - Tidak mendesak</SelectItem>
                            <SelectItem value="sedang">Sedang - Perlu jawaban dalam 3 hari</SelectItem>
                            <SelectItem value="tinggi">Tinggi - Mendesak dan butuh jawaban segera</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="deskripsi">Deskripsi Detail *</Label>
                        <Textarea id="deskripsi" value={newTicket.deskripsi} onChange={e => setNewTicket({
                        ...newTicket,
                        deskripsi: e.target.value
                      })} placeholder="Jelaskan pertanyaan atau masalah Anda secara detail..." rows={8} required />
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Tips untuk Konsultasi yang Efektif:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Jelaskan situasi Anda dengan detail dan spesifik</li>
                      <li>• Sertakan informasi kepegawaian yang relevan (pangkat, jabatan, masa kerja)</li>
                      <li>• Sebutkan regulasi atau kebijakan yang sudah Anda ketahui</li>
                      <li>• Cantumkan deadline jika ada waktu yang mendesak</li>
                    </ul>
                  </div>

                  <Button type="submit" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Kirim Ticket Konsultasi
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: My Tickets */}
          <TabsContent value="my-tickets" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Daftar Ticket Konsultasi Saya</CardTitle>
                    <CardDescription>Pantau status dan progress konsultasi yang telah Anda ajukan</CardDescription>
                  </div>
                  <Button variant="outline">
                    <Search className="w-4 h-4 mr-2" />
                    Cari Ticket
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ticketData.map(ticket => <Card key={ticket.id} className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-foreground">{ticket.nomorTicket}</h3>
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.prioritas)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(ticket.tanggalBuat).toLocaleDateString('id-ID')}
                          </div>
                        </div>

                        <h4 className="font-medium text-foreground mb-2">{ticket.judul}</h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-muted-foreground">Kategori</p>
                            <p className="font-medium">{ticket.kategori}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Unit Pemohon</p>
                            <p className="font-medium">{ticket.pembuatUnit}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Konselor</p>
                            <p className="font-medium">{ticket.konselor || "Belum ditugaskan"}</p>
                          </div>
                          {ticket.rating && <div>
                              <p className="text-muted-foreground">Rating</p>
                              <div className="flex items-center gap-1">
                                {renderStars(ticket.rating)}
                                <span className="ml-1 text-sm">({ticket.rating}/5)</span>
                              </div>
                            </div>}
                        </div>

                        {ticket.feedback && <div className="bg-muted p-3 rounded-lg mb-4">
                            <p className="text-sm font-medium mb-1">Feedback:</p>
                            <p className="text-sm text-muted-foreground">{ticket.feedback}</p>
                          </div>}

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Lihat Detail
                          </Button>
                          {ticket.status === 'resolved' && !ticket.rating && <Button size="sm">
                              <Star className="w-4 h-4 mr-2" />
                              Beri Rating
                            </Button>}
                        </div>
                      </CardContent>
                    </Card>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: FAQ */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Panduan Layanan Kepegawaian dan Daftar Frequently Asked Questions (FAQ)</CardTitle>
                <CardDescription>
                  Pahami panduan berikut dan temukan jawaban untuk pertanyaan yang sering diajukan seputar layanan kepegawaian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faqData.map(faq => <Card key={faq.id} className="border border-border">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between text-base font-normal">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-primary/10 text-primary">{faq.kategori}</Badge>
                              </div>
                              <h4 className="font-semibold text-foreground mb-2">{faq.pertanyaan}</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">{faq.jawaban}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">Apakah ini membantu?</span>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm">
                                  <ThumbsUp className="w-4 h-4 mr-1" />
                                  Ya ({faq.helpful})
                                </Button>
                                <Button variant="outline" size="sm">
                                  <ThumbsDown className="w-4 h-4 mr-1" />
                                  Tidak ({faq.notHelpful})
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Live Chat */}
          <TabsContent value="live-chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Chat dengan Konselor</CardTitle>
                <CardDescription>
                  Chat langsung dengan konselor SDM untuk konsultasi real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Phone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Live Chat Segera Hadir</h3>
                  <p className="text-muted-foreground mb-4">
                    Fitur live chat akan memungkinkan Anda berkonsultasi langsung dengan konselor SDM secara real-time.
                  </p>
                  <Button disabled>
                    Mulai Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Appointment */}
          <TabsContent value="appointment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Jadwal Konsultasi Tatap Muka</CardTitle>
                <CardDescription>
                  Buat janji untuk konsultasi tatap muka dengan konselor SDM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sistem Appointment Segera Hadir</h3>
                  <p className="text-muted-foreground mb-4">
                    Fitur penjadwalan konsultasi akan memungkinkan Anda membuat janji dengan konselor untuk pertemuan tatap muka.
                  </p>
                  <Button disabled>
                    Buat Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}