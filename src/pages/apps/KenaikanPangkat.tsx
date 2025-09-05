import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  User,
  FileText,
  Calculator,
  Clock
} from "lucide-react";

interface PangkatData {
  id: string;
  nama: string;
  nip: string;
  pangkatSekarang: string;
  golonganSekarang: string;
  pangkatTujuan: string;
  golonganTujuan: string;
  masaKerja: { tahun: number; bulan: number };
  syaratTerpenuhi: boolean;
  statusPengajuan: 'eligible' | 'not_eligible' | 'submitted' | 'approved' | 'rejected';
  tanggalTerakhirNaik: string;
}

export default function KenaikanPangkat() {
  const [activeTab, setActiveTab] = useState("check");
  const [selectedPegawai, setSelectedPegawai] = useState("");

  // Mock data for demonstration
  const pangkatData: PangkatData[] = [
    {
      id: "1",
      nama: "Dr. Ahmad Fauzi, S.H., M.H.",
      nip: "196508121990031001",
      pangkatSekarang: "Pembina",
      golonganSekarang: "IV/a",
      pangkatTujuan: "Pembina Tingkat I",
      golonganTujuan: "IV/b",
      masaKerja: { tahun: 15, bulan: 6 },
      syaratTerpenuhi: true,
      statusPengajuan: "eligible",
      tanggalTerakhirNaik: "2020-04-01"
    },
    {
      id: "2",
      nama: "Siti Nurhaliza, S.E., M.M.",
      nip: "197203101995032002",
      pangkatSekarang: "Penata Muda Tingkat I",
      golonganSekarang: "III/b",
      pangkatTujuan: "Penata",
      golonganTujuan: "III/c",
      masaKerja: { tahun: 8, bulan: 3 },
      syaratTerpenuhi: false,
      statusPengajuan: "not_eligible",
      tanggalTerakhirNaik: "2022-01-01"
    }
  ];

  const persyaratanPangkat = [
    { nama: "Masa Kerja Minimal", deskripsi: "4 tahun dalam pangkat terakhir", completed: true },
    { nama: "Pendidikan Minimum", deskripsi: "Sesuai dengan pangkat yang diajukan", completed: true },
    { nama: "DP3/SKP", deskripsi: "Nilai minimal Baik selama 2 tahun terakhir", completed: true },
    { nama: "Diklat Struktural", deskripsi: "Sesuai jenjang jabatan", completed: false },
    { nama: "Tidak Ada Hukuman Disiplin", deskripsi: "Dalam 1 tahun terakhir", completed: true },
    { nama: "Tes Kompetensi", deskripsi: "Lulus tes kompetensi jabatan", completed: false }
  ];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      eligible: { label: "Memenuhi Syarat", className: "bg-green-100 text-green-700" },
      not_eligible: { label: "Belum Memenuhi Syarat", className: "bg-red-100 text-red-700" },
      submitted: { label: "Sedang Diproses", className: "bg-blue-100 text-blue-700" },
      approved: { label: "Disetujui", className: "bg-green-100 text-green-700" },
      rejected: { label: "Ditolak", className: "bg-red-100 text-red-700" }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.not_eligible;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const hitungProgressMasaKerja = (masaKerja: { tahun: number; bulan: number }) => {
    const totalBulan = masaKerja.tahun * 12 + masaKerja.bulan;
    const minimalBulan = 4 * 12; // 4 tahun = 48 bulan
    const progress = Math.min((totalBulan / minimalBulan) * 100, 100);
    return Math.round(progress);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              Pengajuan Kenaikan Pangkat
            </h1>
            <p className="text-muted-foreground mt-2">
              Validasi syarat otomatis dan checklist dokumen persyaratan kenaikan pangkat
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-green-100 text-green-700">
              {pangkatData.filter(p => p.syaratTerpenuhi).length} Memenuhi Syarat
            </Badge>
            <Badge className="bg-red-100 text-red-700">
              {pangkatData.filter(p => !p.syaratTerpenuhi).length} Belum Memenuhi
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="check" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Cek Kelayakan
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Ajukan Kenaikan
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Riwayat Pangkat
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Kalkulator Masa Kerja
            </TabsTrigger>
          </TabsList>

          {/* Tab: Check Eligibility */}
          <TabsContent value="check" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cek Kelayakan Kenaikan Pangkat</CardTitle>
                <CardDescription>
                  Pilih pegawai untuk melakukan pengecekan kelayakan kenaikan pangkat secara otomatis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="pegawai">Pilih Pegawai</Label>
                  <Select value={selectedPegawai} onValueChange={setSelectedPegawai}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pegawai dari database" />
                    </SelectTrigger>
                    <SelectContent>
                      {pangkatData.map((pegawai) => (
                        <SelectItem key={pegawai.id} value={pegawai.id}>
                          {pegawai.nama} - {pegawai.nip}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPegawai && (
                  <div className="space-y-6">
                    {(() => {
                      const pegawai = pangkatData.find(p => p.id === selectedPegawai);
                      if (!pegawai) return null;

                      return (
                        <>
                          {/* Data Pegawai */}
                          <Card className="bg-muted/50">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Nama Pegawai</p>
                                  <p className="font-semibold">{pegawai.nama}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">NIP</p>
                                  <p className="font-mono">{pegawai.nip}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Status Kelayakan</p>
                                  {getStatusBadge(pegawai.statusPengajuan)}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Current vs Target Position */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <User className="w-5 h-5" />
                                  Pangkat Saat Ini
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <p className="text-2xl font-bold text-foreground">{pegawai.pangkatSekarang}</p>
                                  <p className="text-lg text-muted-foreground">Golongan {pegawai.golonganSekarang}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Terakhir naik: {new Date(pegawai.tanggalTerakhirNaik).toLocaleDateString('id-ID')}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <TrendingUp className="w-5 h-5" />
                                  Pangkat Tujuan
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <p className="text-2xl font-bold text-primary">{pegawai.pangkatTujuan}</p>
                                  <p className="text-lg text-muted-foreground">Golongan {pegawai.golonganTujuan}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Naik 1 tingkat dari pangkat saat ini
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Masa Kerja Progress */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Masa Kerja dalam Pangkat
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">
                                    {pegawai.masaKerja.tahun} tahun {pegawai.masaKerja.bulan} bulan
                                  </span>
                                  <span className="text-sm font-medium">
                                    {hitungProgressMasaKerja(pegawai.masaKerja)}% dari syarat minimum
                                  </span>
                                </div>
                                <Progress value={hitungProgressMasaKerja(pegawai.masaKerja)} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                  Minimum 4 tahun masa kerja dalam pangkat untuk kenaikan pangkat
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Requirements Checklist */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Checklist Persyaratan</CardTitle>
                              <CardDescription>
                                Validasi otomatis berdasarkan data pegawai di database
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {persyaratanPangkat.map((syarat, index) => (
                                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                                    {syarat.completed ? (
                                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                    ) : (
                                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{syarat.nama}</p>
                                      <p className="text-xs text-muted-foreground">{syarat.deskripsi}</p>
                                    </div>
                                    <Badge 
                                      className={syarat.completed ? 
                                        "bg-green-100 text-green-700" : 
                                        "bg-yellow-100 text-yellow-700"
                                      }
                                    >
                                      {syarat.completed ? "Terpenuhi" : "Belum"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="mt-6 p-4 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  {pegawai.syaratTerpenuhi ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                  )}
                                  <span className="font-semibold">
                                    {pegawai.syaratTerpenuhi ? "Memenuhi Syarat" : "Belum Memenuhi Syarat"}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {pegawai.syaratTerpenuhi ? 
                                    "Pegawai ini memenuhi semua persyaratan untuk kenaikan pangkat dan dapat mengajukan permohonan." :
                                    "Pegawai ini belum memenuhi beberapa persyaratan. Lengkapi persyaratan yang kurang sebelum mengajukan."
                                  }
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Submit Application */}
          <TabsContent value="submit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengajuan Usulan Kenaikan Pangkat</CardTitle>
                <CardDescription>
                  Form pengajuan usulan kenaikan pangkat dengan kategori dan dokumen persyaratan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pilih Pegawai */}
                <div className="space-y-2">
                  <Label htmlFor="pegawai-pengajuan">Pilih Pegawai</Label>
                  <Select value={selectedPegawai} onValueChange={setSelectedPegawai}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pegawai yang akan diusulkan kenaikan pangkat" />
                    </SelectTrigger>
                    <SelectContent>
                      {pangkatData.map((pegawai) => (
                        <SelectItem key={pegawai.id} value={pegawai.id}>
                          {pegawai.nama} - {pegawai.nip}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Employee Summary Card */}
                {selectedPegawai && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      {(() => {
                        const pegawai = pangkatData.find(p => p.id === selectedPegawai);
                        if (!pegawai) return null;

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Nama Pegawai</p>
                              <p className="font-semibold">{pegawai.nama}</p>
                              <p className="text-sm text-muted-foreground">NIP: {pegawai.nip}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Pangkat Saat Ini</p>
                              <p className="font-semibold">{pegawai.pangkatSekarang}</p>
                              <p className="text-sm text-muted-foreground">Golongan {pegawai.golonganSekarang}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Pangkat Tujuan</p>
                              <p className="font-semibold text-primary">{pegawai.pangkatTujuan}</p>
                              <p className="text-sm text-muted-foreground">Golongan {pegawai.golonganTujuan}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* Kategori Kenaikan Pangkat */}
                <div className="space-y-2">
                  <Label htmlFor="kategori-pangkat">Jenis/Kategori Kenaikan Pangkat</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori kenaikan pangkat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reguler">Kenaikan Pangkat Reguler</SelectItem>
                      <SelectItem value="pilihan">Kenaikan Pangkat Pilihan</SelectItem>
                      <SelectItem value="istimewa">Kenaikan Pangkat Istimewa</SelectItem>
                      <SelectItem value="anumerta">Kenaikan Pangkat Anumerta</SelectItem>
                      <SelectItem value="pengabdian">Kenaikan Pangkat Pengabdian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Catatan Tambahan */}
                <div className="space-y-2">
                  <Label htmlFor="catatan-tambahan">Catatan Tambahan (Opsional)</Label>
                  <textarea
                    id="catatan-tambahan"
                    className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none rounded-md"
                    placeholder="Masukkan catatan atau keterangan tambahan jika diperlukan..."
                  />
                </div>

                {/* Informasi Penting */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">Informasi Penting</h4>
                      <p className="text-sm text-yellow-700">
                        Pastikan semua dokumen yang diunggah sesuai dengan persyaratan dan dapat diakses melalui link Google Drive yang diberikan. Dokumen yang tidak lengkap atau tidak dapat diakses akan menyebabkan pengajuan dikembalikan untuk perbaikan.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Lihat Status Pengajuan
                  </Button>
                  <Button className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Submit Pengajuan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: History */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Kenaikan Pangkat</CardTitle>
                <CardDescription>
                  Lihat riwayat kenaikan pangkat semua pegawai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Riwayat Akan Ditampilkan</h3>
                  <p className="text-muted-foreground">
                    Data riwayat kenaikan pangkat akan terintegrasi dengan database kepegawaian.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Calculator */}
          <TabsContent value="calculator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kalkulator Masa Kerja</CardTitle>
                <CardDescription>
                  Hitung otomatis masa kerja pegawai untuk keperluan kenaikan pangkat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calculator className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Kalkulator Segera Hadir</h3>
                  <p className="text-muted-foreground">
                    Tool kalkulasi masa kerja otomatis akan terintegrasi dengan data kepegawaian.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}