import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Ticket, Star, Clock, CheckCircle, User, Search, Send, Phone, Calendar, HelpCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { LiveChatInterface } from '@/components/chat/LiveChatInterface';
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
  const navigate = useNavigate();
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
    pertanyaan: "Mutasi",
    jawaban: `**Alur dan Prosedur Pengajuan Mutasi**

1. Pegawai mengajukan permohonan mutasi ke TU dengan sepengetahuan Kepala Unit asal.
2. TU unit asal memeriksa ketersediaan formasi (pegawai berkoordinasi dengan unit tujuan).
3. Kepala Unit asal mengajukan Nota Dinas permohonan mutasi ke Sesditjen.
4. Jika disetujui, pegawai melengkapi berkas ke TU.
5. TU mengirimkan berkas ke SDMA Setditjen.
6. SDMA memeriksa berkas, lalu mengajukan surat bebas temuan ke Inspektorat Jenderal dan surat bezetting yang ditandatangani Sesditjen.
7. SDMA mengajukan berkas lengkap ke Biro.
8. Menunggu persetujuan mutasi.
   • Jika ditolak → berkas dikembalikan ke TU unit asal beserta dengan alasan
   • Jika disetujui tetapi ada kekurangan → pegawai wajib melengkapi terlebih dahulu.

**Persyaratan yang Dibutuhkan**

• Surat Pernyataan Lolos Butuh dari PPK Instansi Asal (Asli)
• Surat Keterangan Tidak Sedang Menjalani Hukuman Disiplin (Asli)
• Surat Keterangan Tidak Sedang Menjalani Tugas Belajar/Ikatan Dinas (Asli)
• Surat Keterangan Tidak Mempunyai Hutang Piutang dengan Pihak Bank (Asli)
• Surat Pernyataan Bebas Temuan yang Diterbitkan oleh ITJEN (Asli)
• ANJAB dan ABK yang ditandatangani oleh PPK Instansi Asal (Bila Pindah Antar Kementerian)
• SK CPNS (Fotokopi legalisir)
• SK PNS (Fotokopi legalisir)
• SK Pangkat Terakhir (Fotokopi legalisir)
• SK Jabatan Terakhir (Fotokopi legalisir)
• KARPEG (Fotokopi legalisir)
• Ijazah dan Transkrip Nilai Universitas (Fotokopi legalisir)
• SKP 2 tahun terakhir (Fotokopi legalisir)
• Surat permohonan mutasi dari ybs
• Daftar Riwayat Hidup (DRH) sesuai Keputusan Kepala BKN Nomor 11 Tahun 2002

**FAQ**

**Siapa saja yang bisa mengajukan mutasi?**
Semua PNS yang memenuhi syarat administrasi dan kebutuhan formasi dapat mengajukan mutasi dengan persetujuan atasan dan Kepala Unit asal.

**Apakah mutasi bisa dilakukan tanpa ketersediaan formasi di unit tujuan?**
Tidak. Mutasi hanya dapat dilakukan jika ada formasi di unit tujuan.

**Berapa lama proses mutasi pegawai?**
Waktu bervariasi. Namun, rata-rata 1-3 bulan, tergantung kelengkapan berkas, proses verifikasi, dan persetujuan dari pejabat berwenang.

**Apa yang terjadi jika permohonan mutasi ditolak?**
Berkas akan dikembalikan ke TU unit asal dengan alasan tertulis. Pegawai dapat memperbaiki atau mengajukan kembali sesuai ketentuan.

**Jika mutasi disetujui tetapi berkas kurang lengkap, apa yang harus dilakukan?**
Pegawai wajib melengkapi berkas terlebih dahulu sebelum usulan diproses lebih lanjut.

**Apakah pegawai boleh mengajukan mutasi antar instansi (misalnya antar kementerian/lembaga atau ke pemerintah daerah)?**
Boleh, sepanjang memenuhi syarat, tersedia formasi di instansi tujuan, dan mendapat persetujuan dari kedua instansi serta BKN.`,
    kategori: "Mutasi",
    helpful: 200,
    notHelpful: 5
  }, {
    id: "2",
    pertanyaan: "Kenaikan Pangkat",
    jawaban: `**Alur dan Prosedur Kenaikan Pangkat**

1. Pegawai yang telah memenuhi syarat kenaikan pangkat mengajukan usulan kenaikan pangkat melalui TU unit masing-masing
2. TU mengunggah dokumen persyaratan KP ke link google drive kenaikan pangkat Binalavotas
3. TU memverifikasi kelengkapan administrasi
4. TU mengirimkan berkas usulan ke SDMA Setditjen
5. Petugas SDMA memeriksa berkas dan melakukan verifikasi
6. Apabila terdapat kesalahan maka berkas akan dikembalikan ke TU unit asal
7. Jika berkas sudah lengkap maka petugas SDMA akan mengajukan berkas ke Biro melalui SIASN
8. Biro melakukan verifikasi akhir kemudian meneruskan ke BKN
9. BKN akan melakukan verifikasi akhir dan menerbitkan SK

**Persyaratan Kenaikan Pangkat**

**Kenaikan Pangkat untuk Fungsional Umum**
1. Fotokopi Kartu Pegawai (karpeg)
2. Fotokopi SK Pangkat terakhir
3. Fotokopi ijazah + transkrip nilai terakhir
4. Fotokopi SKP 2 tahun terakhir

**Kenaikan Pangkat Pejabat Struktural**
1. (Nomor 1-4 sama dengan fungsional umum)
2. Fotokopi SK jabatan terakhir
3. Fotokopi surat pernyataan
4. Khusus untuk pejabat struktural eselon III yang pendidikan terakhirnya S1 dan pangkat terakhirnya III/d harus lulus diklat PIM III atau ujian dinas

**Kenaikan Pangkat Pejabat Fungsional**
1. (Nomor 1-4 sama dengan fungsional umum)
2. Fotokopi SK jabatan fungsional terakhir
3. Fotokopi PAK mulai dari yang tercantum pada SK pangkat terakhir sampai dengan PAK terakhir (berurutan tiap periode)
PAK terakhir harus asli
4. Khusus untuk pejabat fungsional terampil yang akan pindah/naik ke tingkat ahli harus lulus diklat alih kategori dan ijazah terakhir sudah dinilai dalam PAK (Predikat Angka Kredit)

**Pertama kali naik pangkat**
1.(Nomor 1-4 sama dengan fungsional umum)
2. Fotokopi SK CPNS

**Kenaikan Pangkat Penyesuaian Ijazah**
1. (Nomor 1-4 sama dengan fungsional umum)
2. Fotokopi surat tanda lulus ujian penyesuaian kenaikan pangkat
3. Uraian tugas
4. Fotokopi ijazah + transkrip nilai terakhir yang telah dilegalisir ASLI

**Kenaikan pangkat golongan II/d ke III/a**
1. (Nomor 1-4 sama dengan fungsional umum)
2. Fotokopi surat tanda lulus ujian dinas

**FAQ Kenaikan Pangkat**

**Kapan kenaikan pangkat diajukan?**
Dua bulan sebelum periode pengajuan kenaikan pangkat (apabila akan mengikuti kenaikan pangkat periode September, maka pengumpulan dokumen dan berkas persyaratan dimulai pada bulan Juli)

**Apa yang terjadi jika berkas saya tidak lengkap?**
Jika berkas tidak lengkap, usulan tidak dapat diproses. TU atau petugas SDMA akan mengembalikan berkas untuk dilengkapi terlebih dahulu.

**Apakah kenaikan pangkat otomatis diberikan jika sudah memenuhi masa kerja?**
Untuk jabatan pelaksana kenaikan pangkat diberikan secara otomatis (selama SKP memenuhi syarat) tetapi proses administrasi tetap dilaksanakan sesuai prosedur.
Untuk jabatan fungsional harus mengajukan sesuai angka kredit.

**Apakah kenaikan pangkat karena pendidikan bisa langsung diajukan setelah lulus kuliah?**
Bisa, dengan catatan pendidikan sudah diakui oleh BKN sehingga setelah kuliah pegawai yang bersangkutan wajib melaporkan ke atasan dan mengajukan izin penggunaan gelar.`,
    kategori: "Kenaikan Pangkat",
    helpful: 0,
    notHelpful: 0
  }, {
    id: "3",
    pertanyaan: "Pensiun",
    jawaban: `**Alur dan Prosedur Pensiun**

1. TU unit asal melakukan pemberitahuan kepada pegawai yang akan memasuki usia pensiun
2. Pegawai menyiapkan dan menyerahkan berkas pensiun ke TU
3. TU memverifikasi kelengkapan administrasi
4. TU mengirimkan berkas usulan pensiun ke Setditjen
5. Petugas SDMA melakukan pemeriksaan kelengkapan berkas
6. SDMA Setditjen mengirimkan berkas ke Biro

**Persyaratan Pensiun**

**Masa Persiapan Pensiun**
1. Surat permohonan pensiun dari ybs
2. Fotokopi karpeg
3. Fotokopi surat nikah
4. Fotokopi SK pengangkatan sebagai CPNS
5. Fotokopi SK pengangkatan CPNS menjadi PNS
6. Fotokopi SK kenaikan pangkat
7. Fotokopi gaji berkala terakhir
8. Fotokopi penilaian prestasi kerja 2 tahun terakhir
9. Surat pernyataan tidak pernah dijatuhi hukuman disiplin sedang/berat dalam 1 tahun terakhir
10. Foto pegawai ybs
11. Surat pernyataan tidak sedang menjalani proses pidana

**Pensiun Reguler**
1. Surat permohonan pensiun dari ybs (tanpa kop unit kerja)
2. Daftar susunan keluarga, tidak perlu ttd camat dan lurah, bila anak sudah berkeluarga tetap dimasukkan untuk data
3. Kartu pegawai
4. Akte/surat nikah
5. Akte kelahiran anak (jika masih ada anak yang menjadi tanggungan)
6. SK pengangkatan CPNS
7. SK pengangkatan CPNS menjadi PNS
8. SK kenaikan pangkat terakhir
9. Kenaikan gaji berkala terakhir
10. Penilaian prestasi kerja (SKP) 2 tahun terakhir
11. Surat pernyataan tidak pernah dijatuhi hukuman disiplin sedang/berat dalam 1 tahun terakhir
12. Surat pernyataan tidak sedang menjalani proses pidana
13. Foto pegawai ybs
14. Data perorangan calon penerima pensiun
15. Surat keterangan kematian (bila ada)
16. KTP
17. NPWP
18. Buku tabungan
19. Surat keterangan sekolah/kuliah (bila terdapat anak yang masih menjadi tanggungan)

**Pensiun Janda atau Duda**
1. Surat permohonan pensiun dari janda/duda ybs
2. Daftar susunan keluarga (ttd lurah dan camat)
3. Fotokopi kartu pegawai almarhum
4. Fotokopi surat nikah dan akte kelahiran anak
5. Fotokopi SK pengangkatan CPNS almarhum
6. Fotokopi pengangkatan CPNS menjadi PNS almarhum
7. Fotokopi SK kenaikan pangkat almarhum
8. Fotokopi gaji berkala terakhir almarhum
9. Fotokopi penilaian prestasi kerja 2 tahun terakhir almarhum
10. Surat pernyataan tidak pernah dijatuhi hukdis sedang/berat dalam 1 tahun terakhir
11. Surat pernyataan tidak sedang menjalani proses pidana almarhum
12. Data perorangan calon penerima pensiun
13. Foto janda/duda ybs
14. Surat keterangan kematian yang sah dari Dukcapil
15. Surat keterangan janda/duda dari kelurahan
16. Fotokopi karis (untuk janda) /karsu (untuk duda)
17. Fotokopi KTP janda/duda
18. Fotokopi NPWP janda/duda
19. Fotokopi buku tabungan janda/duda
20. Surat keterangan sekolah/kuliah (bila terdapat anak yang masih menjadi tanggungan)

**Pensiun Anak**
1. Surat permohonan pensiun dari anak (ttd anak, tanpa kop)
2. Daftar susunan keluarga (ttd lurah dan camat)
3. Fotokopi kartu pegawai
4. Fotokopi surat nikah
5. Fotokopi surat pengangkatan CPNS
6. Fotokopi SK pengangkatan CPNS menjadi PNS
7. Fotokopi SK kenaikan pangkat
8. Fotokopi gaji berkala terakhir
9. Fotokopi penilaian prestasi kerja 2 tahun terakhir
10. Surat pernyataan tidak pernah dijatuhi hukuman disiplin sedang/berat dalam 1 tahun terakhir
11. Surat pernyataan tidak sedang menjalani proses pidana
12. Data perorangan calon penerima pensiun (ttd anak)
13. Foto anak
14. Surat keterangan kematian yang sah

**FAQ Pensiun**

**Kapan paling lambat PNS harus mengajukan berkas pensiun?**
Berkas pengajuan pensiun wajib disampaikan setidaknya 12 bulan sebelum TMT pensiun. TU biasanya sudah memberi pemberitahuan paling tidak sejak 12 bulan sebelum pensiun.

**Jika berkas saya tidak lengkap, apakah pengajuan pensiun bisa diproses?**
Tidak. Berkas harus lengkap agar bisa diproses. Jika ada kekurangan, TU atau Petugas SDMA akan mengembalikan berkas untuk dilengkapi.

**Siapa yang mengurus pengajuan pensiun saya?**
Pegawai yang bersangkutan menyerahkan berkas ke TU unit asal, lalu diteruskan ke SDMA Setditjen, dan selanjutnya diproses oleh Biro OSDMA ke BKN.

**Berapa lama proses pengajuan pensiun sampai SK terbit?**
Umumnya sekitar 3-6 bulan sebelum TMT pensiun. Namun, proses bisa lebih cepat atau lebih lama tergantung kelengkapan berkas.

**Apakah ada konsekuensi jika saya terlambat mengajukan pensiun?**
Jika terlambat, bisa berdampak pada keterlambatan penerbitan SK pensiun dan keterlambatan pembayaran pensiun pertama. Karena itu, pengajuan sebaiknya dilakukan jauh hari sebelum masa pensiun.

**Apakah ahli waris juga harus mengajukan pensiun jika PNS meninggal dunia?**
Ya. Ahli waris (janda/duda/anak) perlu mengajukan usulan pensiun janda/duda/anak dengan melampirkan dokumen pendukung.`,
    kategori: "Pensiun",
    helpful: 0,
    notHelpful: 0
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
              Panduan Layanan Mutasi, Kenaikan Pangkat, & Pensiun
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
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-primary/10 text-primary">{faq.kategori}</Badge>
                              </div>
                              <h4 className="font-semibold text-foreground mb-2">{faq.pertanyaan}</h4>
                              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                                {faq.jawaban.split('\n\n').map((section, index) => {
                                  if (section.startsWith('**') && section.endsWith('**')) {
                                    return <h5 key={index} className="font-semibold text-foreground text-base mt-4 mb-2">{section.replace(/\*\*/g, '')}</h5>;
                                  }
                                  return (
                                    <div key={index} className="space-y-1">
                                      {section.split('\n').map((line, lineIndex) => (
                                        <p key={lineIndex} className={line.startsWith('•') || /^\d+\./.test(line) ? 'ml-0' : line.startsWith('   •') ? 'ml-4' : ''}>
                                          {line}
                                        </p>
                                      ))}
                                    </div>
                                  );
                                })}
                              </div>
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
            <LiveChatInterface />
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
                  <h3 className="text-lg font-semibold mb-2">Jadwalkan Konsultasi Tatap Muka</h3>
                  <p className="text-muted-foreground mb-4">
                    Buat janji dengan konselor untuk mendapat bantuan langsung terkait kepegawaian Anda.
                  </p>
                  <Button onClick={() => navigate("/apps/jadwal-konsultasi")}>
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