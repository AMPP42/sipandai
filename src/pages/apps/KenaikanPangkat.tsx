import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, CheckCircle, AlertTriangle, Calendar, User, FileText, Calculator, Clock, Search, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DocumentRevisionModal from "@/components/verifikasi/DocumentRevisionModal";
import type { Database } from '@/integrations/supabase/types';

type Application = Database['public']['Tables']['applications']['Row'];
interface PangkatData {
  id: string;
  nama: string;
  nip: string;
  pangkatSekarang: string;
  golonganSekarang: string;
  pangkatTujuan: string;
  golonganTujuan: string;
  masaKerja: {
    tahun: number;
    bulan: number;
  };
  syaratTerpenuhi: boolean;
  statusPengajuan: 'eligible' | 'not_eligible' | 'submitted' | 'approved' | 'rejected';
  tanggalTerakhirNaik: string;
}
type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

export default function KenaikanPangkat() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("check");
  const [selectedPegawai, setSelectedPegawai] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("");
  const [selectedPeriode, setSelectedPeriode] = useState("");
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [loading, setLoading] = useState(false);
  const [documentLinks, setDocumentLinks] = useState<{[key: string]: string}>({});
  const [catatanTambahan, setCatatanTambahan] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplicationForRevision, setSelectedApplicationForRevision] = useState<Application | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [user?.id]);

  const loadApplications = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('Loading applications for user:', user.id, 'unit:', user.unit);
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('jenis', 'kenaikan_pangkat')
        .eq('submitter_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading applications:', error);
        throw error;
      }
      console.log('Loaded applications:', data?.length || 0);
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data pengajuan: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Employee data from database
  const [employees, setEmployees] = useState<any[]>([]);
  const [pangkatData, setPangkatData] = useState<PangkatData[]>([]);

  useEffect(() => {
    loadEmployees();
  }, [user?.unit]);

  const loadEmployees = async () => {
    try {
      if (!user?.unit) {
        console.error('User unit not found');
        setEmployees([]);
        setPangkatData([]);
        return;
      }

      console.log('Loading employees for unit:', user.unit);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('unit', user.unit)
        .order('nama');
      
      if (error) {
        console.error('Error loading employees:', error);
        throw error;
      }
      
      console.log('Loaded employees for unit', user.unit, ':', data?.length || 0);
      setEmployees(data || []);
      
      // Transform employee data to pangkat data
      const transformedData: PangkatData[] = (data || []).map((emp) => ({
        id: emp.id,
        nama: emp.nama,
        nip: emp.nip || '',
        pangkatSekarang: emp.pangkat || 'Belum Diset',
        golonganSekarang: 'III/a', // This should be calculated from pangkat
        pangkatTujuan: 'Belum Ditentukan',
        golonganTujuan: 'III/b',
        masaKerja: {
          tahun: 4,
          bulan: 0
        },
        syaratTerpenuhi: true,
        statusPengajuan: "eligible" as const,
        tanggalTerakhirNaik: "2020-04-01"
      }));
      
      setPangkatData(transformedData);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pegawai",
        variant: "destructive"
      });
      setEmployees([]);
      setPangkatData([]);
    }
  };
  const persyaratanPangkat = [{
    nama: "Masa Kerja Minimal",
    deskripsi: "4 tahun dalam pangkat terakhir",
    completed: true
  }, {
    nama: "Pendidikan Minimum",
    deskripsi: "Sesuai dengan pangkat yang diajukan",
    completed: true
  }, {
    nama: "DP3/SKP",
    deskripsi: "Nilai minimal Baik selama 2 tahun terakhir",
    completed: true
  }, {
    nama: "Diklat Struktural",
    deskripsi: "Sesuai jenjang jabatan",
    completed: false
  }, {
    nama: "Tidak Ada Hukuman Disiplin",
    deskripsi: "Dalam 1 tahun terakhir",
    completed: true
  }, {
    nama: "Tes Kompetensi",
    deskripsi: "Lulus tes kompetensi jabatan",
    completed: false
  }];
  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: {
        label: "Draft",
        className: "bg-gray-100 text-gray-700"
      },
      submitted: {
        label: "Menunggu Verifikasi",
        className: "bg-yellow-100 text-yellow-700"
      },
      revision_needed: {
        label: "Perbaikan",
        className: "bg-red-100 text-red-700"
      },
      approved: {
        label: "Disetujui", 
        className: "bg-blue-100 text-blue-700"
      },
      completed: {
        label: "Terbit",
        className: "bg-green-100 text-green-700"
      },
      in_review: {
        label: "Sedang Direview",
        className: "bg-orange-100 text-orange-700"
      },
      rejected: {
        label: "Ditolak",
        className: "bg-red-100 text-red-700"
      },
      eligible: {
        label: "Memenuhi Syarat",
        className: "bg-green-100 text-green-700"
      },
      not_eligible: {
        label: "Belum Memenuhi Syarat",
        className: "bg-red-100 text-red-700"
      }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.not_eligible;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };
  const hitungProgressMasaKerja = (masaKerja: {
    tahun: number;
    bulan: number;
  }) => {
    const totalBulan = masaKerja.tahun * 12 + masaKerja.bulan;
    const minimalBulan = 4 * 12; // 4 tahun = 48 bulan
    const progress = Math.min(totalBulan / minimalBulan * 100, 100);
    return Math.round(progress);
  };
  const getKategoriName = (kategori: string) => {
    const kategoriMap: {
      [key: string]: string;
    } = {
      reguler: "Kenaikan Pangkat Reguler (Jabatan Pelaksana)",
      fungsional: "Kenaikan Pangkat Jabatan Fungsional",
      struktural: "Kenaikan Pangkat Jabatan Struktural",
      pertama_kali: "Kenaikan Pangkat Pertama Kali",
      penyesuaian_ijazah: "Kenaikan Pangkat Penyesuaian Ijazah",
      iid_ke_iiia: "Kenaikan Pangkat Golongan II/d ke III/a"
    };
    return kategoriMap[kategori] || kategori;
  };
  const getDocumentRequirements = (kategori: string) => {
    const documents: {
      [key: string]: Array<{
        nama: string;
        catatan?: string;
      }>;
    } = {
      reguler: [{
        nama: "SKP 2 tahun terakhir",
        catatan: "Nilai minimal 'Baik', Nilai 'Sangat Baik' perlu dilampirkan bukti inovasi; Wajib ada lembar 'Dokumen Evaluasi Kinerja Pegawai'"
      }, {
        nama: "SK Jabatan terakhir"
      }, {
        nama: "SK Pangkat terakhir"
      }, {
        nama: "Kartu Pegawai"
      }, {
        nama: "Ijazah + Transkrip nilai terakhir"
      }, {
        nama: "Nota Dinas"
      }],
      fungsional: [{
        nama: "PAK tahun 2022 hingga saat ini",
        catatan: "Wajib 3 lembar di setiap tahun"
      }, {
        nama: "SKP 2 tahun terakhir",
        catatan: "Nilai minimal 'Baik', Nilai 'Sangat Baik' perlu dilampirkan bukti inovasi; Wajib ada lembar 'Dokumen Evaluasi Kinerja Pegawai'"
      }, {
        nama: "SK Jabatan terakhir",
        catatan: "Wajib disertai sertifikat uji kompetensi bagi pegawai yang naik jabatan"
      }, {
        nama: "SK Pangkat terakhir"
      }, {
        nama: "Kartu Pegawai"
      }, {
        nama: "Ijazah + transkrip nilai terakhir"
      }, {
        nama: "Nota Dinas"
      }],
      struktural: [{
        nama: "SKP 2 tahun terakhir",
        catatan: "Nilai minimal 'Baik', Nilai 'Sangat Baik' perlu dilampirkan bukti inovasi; Wajib ada lembar 'Dokumen Evaluasi Kinerja Pegawai'"
      }, {
        nama: "SK Jabatan terakhir"
      }, {
        nama: "SK Pangkat terakhir"
      }, {
        nama: "Kartu Pegawai"
      }, {
        nama: "Ijazah + Transkrip Nilai terakhir"
      }, {
        nama: "Surat Pernyataan Pelantikan"
      }, {
        nama: "Surat Pernyataan Melaksanakan Tugas"
      }, {
        nama: "Surat Pernyataan Pelantikan"
      }, {
        nama: "Khusus untuk Pejabat Struktural Eselon III yang pendidikan terakhirnya S1 dan pangkat terakhirnya dilakulukan, wajib lulus diklat PIM III"
      }, {
        nama: "Nota Dinas"
      }],
      pertama_kali: [{
        nama: "SK CPNS"
      }, {
        nama: "SK PNS"
      }, {
        nama: "SKP 2 tahun terakhir",
        catatan: "Nilai minimal 'Baik'; Nilai 'Sangat Baik' perlu dilampirkan bukti inovasi; Wajib ada lembar 'Dokumen Evaluasi Kinerja Pegawai'"
      }, {
        nama: "PAK tahun 2022 hingga saat ini",
        catatan: "Khusus untuk jabatan fungsional; Wajib 3 lembar di setiap tahun"
      }, {
        nama: "SK Jabatan",
        catatan: "Khusus untuk jabatan fungsional"
      }, {
        nama: "Berita Acara Pengambilan Sumpah Jabatan PNS",
        catatan: "Khusus untuk jabatan fungsional"
      }, {
        nama: "SK Pangkat terakhir"
      }, {
        nama: "Kartu Pegawai"
      }, {
        nama: "Ijazah + Transkrip Nilai terakhir"
      }, {
        nama: "Nota Dinas"
      }],
      penyesuaian_ijazah: [{
        nama: "Surat Tanda Lulus Ujian Penyesuaian Kenaikan Pangkat"
      }, {
        nama: "Ijazah + Transkrip Nilai terakhir yang telah dilegalisir"
      }, {
        nama: "Uraian Tugas"
      }, {
        nama: "SKP 2 tahun terakhir",
        catatan: "Nilai minimal 'Baik', Nilai 'Sangat Baik' perlu dilampirkan bukti inovasi; Wajib ada lembar 'Dokumen Evaluasi Kinerja Pegawai'"
      }, {
        nama: "SK Jabatan terakhir"
      }, {
        nama: "SK Pangkat terakhir"
      }, {
        nama: "Kartu Pegawai"
      }, {
        nama: "Ijazah + Transkrip Nilai terakhir"
      }, {
        nama: "Nota Dinas"
      }],
      iid_ke_iiia: [{
        nama: "Surat Tanda Lulus Ujian Dinas"
      }, {
        nama: "SKP 2 tahun terakhir",
        catatan: "Nilai minimal 'Baik', Nilai 'Sangat Baik' perlu dilampirkan bukti inovasi; Wajib ada lembar 'Dokumen Evaluasi Kinerja Pegawai'"
      }, {
        nama: "SK Jabatan",
        catatan: "Khusus untuk jabatan fungsional"
      }, {
        nama: "SK Pangkat terakhir"
      }, {
        nama: "Kartu Pegawai"
      }, {
        nama: "Ijazah + Transkrip Nilai terakhir"
      }, {
        nama: "Nota Dinas"
      }]
    };
    return documents[kategori] || [];
  };

  const handleSubmitPengajuan = async () => {
    if (!selectedPegawai || !selectedKategori || !selectedPeriode) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua data yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    const selectedEmployee = pangkatData.find(p => p.id === selectedPegawai);
    if (!selectedEmployee) {
      toast({
        title: "Error", 
        description: "Data pegawai tidak ditemukan",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Generate application number
      const currentYear = new Date().getFullYear();
      const { data: existingApps } = await supabase
        .from('applications')
        .select('id')
        .eq('jenis', 'kenaikan_pangkat')
        .gte('created_at', `${currentYear}-01-01`);
      
      const sequence = String(existingApps?.length + 1 || 1).padStart(4, '0');
      const nomorUsulan = `KP/${currentYear}/${sequence}`;

      const applicationData: ApplicationInsert = {
        jenis: 'kenaikan_pangkat' as const,
        judul: `Pengajuan Kenaikan Pangkat - ${selectedEmployee.nama}`,
        submitter_id: user?.id || '',
        submitter_name: user?.name || '',
        submitter_unit: user?.unit || '',
        status: 'submitted' as const,
        estimasi: JSON.stringify({
          employee_id: selectedEmployee.id,
          employee_name: selectedEmployee.nama,
          employee_nip: selectedEmployee.nip,
          pangkat_sekarang: selectedEmployee.pangkatSekarang,
          golongan_sekarang: selectedEmployee.golonganSekarang,
          pangkat_tujuan: selectedEmployee.pangkatTujuan,
          golongan_tujuan: selectedEmployee.golonganTujuan,
          kategori: selectedKategori,
          kategori_name: getKategoriName(selectedKategori),
          periode: selectedPeriode,
          masa_kerja: selectedEmployee.masaKerja,
          syarat_terpenuhi: selectedEmployee.syaratTerpenuhi,
          nomor_usulan: nomorUsulan,
          document_links: documentLinks,
          catatan_tambahan: catatanTambahan
        })
      };

      const { error } = await supabase
        .from('applications')
        .insert(applicationData);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Pengajuan kenaikan pangkat untuk ${selectedEmployee.nama} berhasil disubmit dan dapat dilihat di tab Status Usulan!`,
      });

      // Reset form
      setSelectedPegawai("");
      setSelectedKategori("");
      setSelectedPeriode("");
      setDocumentLinks({});
      setCatatanTambahan("");
      
      // Refresh applications after successful submission
      await loadApplications();
      
      // Redirect to status tab
      setActiveTab("status");

    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengajukan kenaikan pangkat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen bg-background p-6">
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
            <TabsTrigger value="status" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Status Usulan
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
                       {employees.map(employee => <SelectItem key={employee.id} value={employee.id}>
                           {employee.nama} - {employee.nip || 'Tanpa NIP'}
                         </SelectItem>)}
                     </SelectContent>
                  </Select>
                </div>

                {selectedPegawai && <div className="space-y-6">
                    {(() => {
                  const pegawai = pangkatData.find(p => p.id === selectedPegawai);
                  if (!pegawai) return null;
                  return <>
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
                                {persyaratanPangkat.map((syarat, index) => <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                                    {syarat.completed ? <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />}
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{syarat.nama}</p>
                                      <p className="text-xs text-muted-foreground">{syarat.deskripsi}</p>
                                    </div>
                                    <Badge className={syarat.completed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                                      {syarat.completed ? "Terpenuhi" : "Belum"}
                                    </Badge>
                                  </div>)}
                              </div>
                              
                              <div className="mt-6 p-4 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  {pegawai.syaratTerpenuhi ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                                  <span className="font-semibold">
                                    {pegawai.syaratTerpenuhi ? "Memenuhi Syarat" : "Belum Memenuhi Syarat"}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {pegawai.syaratTerpenuhi ? "Pegawai ini memenuhi semua persyaratan untuk kenaikan pangkat dan dapat mengajukan permohonan." : "Pegawai ini belum memenuhi beberapa persyaratan. Lengkapi persyaratan yang kurang sebelum mengajukan."}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </>;
                })()}
                  </div>}
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
                {/* Pilih Periode */}
                <div className="space-y-2">
                  <Label htmlFor="periode-kenaikan">Periode Kenaikan Pangkat</Label>
                  <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih periode kenaikan pangkat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="januari">Januari</SelectItem>
                      <SelectItem value="februari">Februari</SelectItem>
                      <SelectItem value="maret">Maret</SelectItem>
                      <SelectItem value="april">April</SelectItem>
                      <SelectItem value="mei">Mei</SelectItem>
                      <SelectItem value="juni">Juni</SelectItem>
                      <SelectItem value="juli">Juli</SelectItem>
                      <SelectItem value="agustus">Agustus</SelectItem>
                      <SelectItem value="september">September</SelectItem>
                      <SelectItem value="oktober">Oktober</SelectItem>
                      <SelectItem value="november">November</SelectItem>
                      <SelectItem value="desember">Desember</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pilih Pegawai */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Pilih Pegawai</Label>
                  {selectedPegawai ? (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        {(() => {
                          const pegawai = pangkatData.find(p => p.id === selectedPegawai);
                          if (!pegawai) return null;
                          return (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-primary" />
                                <div>
                                  <p className="font-medium">{pegawai.nama}</p>
                                  <p className="text-sm text-muted-foreground">
                                    NIP: {pegawai.nip} | {pegawai.pangkatSekarang} ({pegawai.golonganSekarang})
                                  </p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => setSelectedPegawai("")}>
                                Ubah
                              </Button>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  ) : (
                    <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Pilih Pegawai
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Pilih Pegawai</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            <Input
                              placeholder="Cari nama atau NIP..."
                              value={searchEmployee}
                              onChange={(e) => setSearchEmployee(e.target.value)}
                            />
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nama</TableHead>
                                  <TableHead>NIP</TableHead>
                                  <TableHead>Unit</TableHead>
                                  <TableHead>Jabatan</TableHead>
                                  <TableHead>Aksi</TableHead>
                                </TableRow>
                              </TableHeader>
                               <TableBody>
                                 {employees
                                   .filter(pegawai => 
                                     pegawai.nama.toLowerCase().includes(searchEmployee.toLowerCase()) ||
                                     (pegawai.nip && pegawai.nip.includes(searchEmployee))
                                   )
                                   .map((pegawai) => (
                                   <TableRow key={pegawai.id}>
                                     <TableCell className="font-medium">{pegawai.nama}</TableCell>
                                     <TableCell>{pegawai.nip || '-'}</TableCell>
                                     <TableCell>{pegawai.unit || '-'}</TableCell>
                                     <TableCell>{pegawai.jabatan || '-'}</TableCell>
                                     <TableCell>
                                       <Button
                                         size="sm"
                                         onClick={() => {
                                           setSelectedPegawai(pegawai.id);
                                           setIsEmployeeDialogOpen(false);
                                         }}
                                       >
                                         Pilih
                                       </Button>
                                     </TableCell>
                                   </TableRow>
                                 ))}
                               </TableBody>
                            </Table>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Employee Summary Card */}
                {selectedPegawai && <Card className="bg-muted/50">
                    <CardContent className="p-4">
                       {(() => {
                    const employee = employees.find(emp => emp.id === selectedPegawai);
                    const pangkatInfo = pangkatData.find(p => p.id === selectedPegawai);
                    if (!employee || !pangkatInfo) return null;
                    return <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Nama Pegawai</p>
                                <p className="font-semibold">{employee.nama}</p>
                                <p className="text-sm text-muted-foreground">NIP: {employee.nip || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Unit Kerja</p>
                                <p className="font-semibold">{employee.unit || '-'}</p>
                                <p className="text-sm text-muted-foreground">Jabatan: {employee.jabatan || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Pangkat Saat Ini</p>
                                <p className="font-semibold">{employee.pangkat || 'Belum Diset'}</p>
                                <p className="text-sm text-muted-foreground">Golongan {pangkatInfo.golonganSekarang}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Pangkat Tujuan</p>
                                <p className="font-semibold text-primary">{pangkatInfo.pangkatTujuan}</p>
                                <p className="text-sm text-muted-foreground">Golongan {pangkatInfo.golonganTujuan}</p>
                              </div>
                            </div>
                            
                            {/* Masa Kerja dalam Pangkat */}
                            <div className="border-t pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Masa Kerja dalam Pangkat</span>
                              </div>
                               <div className="space-y-2">
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm text-muted-foreground">
                                     {pangkatInfo.masaKerja.tahun} tahun {pangkatInfo.masaKerja.bulan} bulan
                                   </span>
                                   <span className="text-sm font-medium">
                                     Masa kerja: {employee.masa_kerja || 'Belum dihitung'}
                                   </span>
                                 </div>
                                 <p className="text-xs text-muted-foreground">
                                   Minimum 4 tahun masa kerja dalam pangkat untuk kenaikan pangkat
                                 </p>
                               </div>
                            </div>
                          </div>;
                  })()}
                    </CardContent>
                  </Card>}

                {/* Kategori Kenaikan Pangkat */}
                <div className="space-y-2">
                  <Label htmlFor="kategori-pangkat">Jenis/Kategori Kenaikan Pangkat</Label>
                  <Select value={selectedKategori} onValueChange={setSelectedKategori}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori kenaikan pangkat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reguler">Kenaikan Pangkat Reguler (Jabatan Pelaksana)</SelectItem>
                      <SelectItem value="fungsional">Kenaikan Pangkat Jabatan Fungsional</SelectItem>
                      <SelectItem value="struktural">Kenaikan Pangkat Jabatan Struktural</SelectItem>
                      <SelectItem value="pertama_kali">Kenaikan Pangkat Pertama Kali</SelectItem>
                      <SelectItem value="penyesuaian_ijazah">Kenaikan Pangkat Penyesuaian Ijazah</SelectItem>
                      <SelectItem value="iid_ke_iiia">Kenaikan Pangkat Golongan II/d ke III/a</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Document Requirements Section */}
                {selectedKategori && <Card>
                    <CardHeader>
                      <CardTitle>Dokumen Persyaratan - {getKategoriName(selectedKategori)}</CardTitle>
                      <CardDescription>
                        Silakan upload link Google Drive untuk setiap dokumen yang diperlukan
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {getDocumentRequirements(selectedKategori).map((doc, index) => <div key={index} className="space-y-2">
                          <Label htmlFor={`doc-${index}`}>
                            {index + 1}. {doc.nama}
                            {doc.catatan && <span className="text-sm text-muted-foreground block mt-1">
                                Catatan: {doc.catatan}
                              </span>}
                          </Label>
                          <div className="flex gap-2">
                            <Input 
                              id={`doc-${index}`} 
                              placeholder="Masukkan link Google Drive dokumen..." 
                              className="flex-1"
                              value={documentLinks[`doc-${index}`] || ''}
                              onChange={(e) => setDocumentLinks(prev => ({
                                ...prev,
                                [`doc-${index}`]: e.target.value
                              }))}
                            />
                          </div>
                        </div>)}
                    </CardContent>
                  </Card>}

                {/* Catatan Tambahan */}
                <div className="space-y-2">
                  <Label htmlFor="catatan-tambahan">Catatan Tambahan (Opsional)</Label>
                  <textarea 
                    id="catatan-tambahan" 
                    className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none rounded-md" 
                    placeholder="Masukkan catatan atau keterangan tambahan jika diperlukan..."
                    value={catatanTambahan}
                    onChange={(e) => setCatatanTambahan(e.target.value)}
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
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => setActiveTab("status")}
                  >
                    <FileText className="w-4 h-4" />
                    Lihat Status Pengajuan
                  </Button>
                  <Button 
                    className="flex items-center gap-2"
                    onClick={handleSubmitPengajuan}
                    disabled={loading}
                  >
                    <TrendingUp className="w-4 h-4" />
                    {loading ? "Mengirim..." : "Submit Pengajuan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Status Usulan */}
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Usulan Kenaikan Pangkat</CardTitle>
                <CardDescription>
                  Pantau status pengajuan usulan kenaikan pangkat yang telah disubmit
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Memuat Data...</h3>
                    <p className="text-muted-foreground">
                      Sedang memuat data pengajuan kenaikan pangkat
                    </p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belum Ada Pengajuan</h3>
                    <p className="text-muted-foreground mb-4">
                      Anda belum memiliki pengajuan kenaikan pangkat yang disubmit.
                    </p>
                    <Button onClick={() => setActiveTab("submit")}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Buat Pengajuan Baru
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No. Usulan</TableHead>
                          <TableHead>Nama Pegawai</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Periode</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tanggal Pengajuan</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((app) => {
                          const estimasiData = app.estimasi ? JSON.parse(app.estimasi) : {};
                          return (
                            <TableRow key={app.id}>
                              <TableCell className="font-mono">
                                {estimasiData.nomor_usulan || 'N/A'}
                              </TableCell>
                              <TableCell className="font-medium">
                                {estimasiData.employee_name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {estimasiData.kategori_name || 'N/A'}
                              </TableCell>
                              <TableCell className="capitalize">
                                {estimasiData.periode || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(app.status)}
                              </TableCell>
                              <TableCell>
                                {new Date(app.created_at).toLocaleDateString('id-ID')}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApplicationForRevision(app);
                                    setIsRevisionModalOpen(true);
                                  }}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Detail
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline Terbaru</CardTitle>
                <CardDescription>
                  Aktivitas terbaru terkait pengajuan kenaikan pangkat
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.slice(0, 5).map((app) => {
                      const estimasiData = app.estimasi ? JSON.parse(app.estimasi) : {};
                      return (
                        <div key={app.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                          <div className="flex-shrink-0">
                            {app.status === 'submitted' && <Clock className="w-5 h-5 text-yellow-500" />}
                            {app.status === 'approved' && <CheckCircle className="w-5 h-5 text-blue-500" />}
                            {app.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                            {app.status === 'revision_needed' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                            {app.status === 'in_review' && <Clock className="w-5 h-5 text-orange-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              Pengajuan kenaikan pangkat untuk {estimasiData.employee_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(app.created_at).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div>
                            {getStatusBadge(app.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Timeline akan ditampilkan setelah pengajuan dibuat
                    </p>
                  </div>
                )}
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

        {/* Document Revision Modal */}
        {selectedApplicationForRevision && (
          <DocumentRevisionModal
            open={isRevisionModalOpen}
            onOpenChange={setIsRevisionModalOpen}
            application={selectedApplicationForRevision}
            onRevisionSubmitted={() => {
              loadApplications();
              setSelectedApplicationForRevision(null);
            }}
          />
        )}
      </div>
    </div>;
}