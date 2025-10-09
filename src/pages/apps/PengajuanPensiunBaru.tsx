import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  User,
  Calendar,
  Loader2
} from "lucide-react";

interface Employee {
  id: string;
  nama: string;
  nip: string | null;
  tanggal_lahir: string | null;
  tmt_pensiun: string | null;
  unit: string | null;
  jabatan: string | null;
  pangkat: string | null;
  masa_kerja: string | null;
}

const retirementCategories: { [key: string]: { label: string, documents: string[] } } = {
  "pensiun_reguler": {
    label: "Pensiun Reguler",
    documents: [
      "Surat Permohonan Pensiun dari Ybs",
      "Foto Pegawai",
      "KTP",
      "NPWP",
      "Daftar Susunan Keluarga",
      "Kartu Pegawai",
      "Surat Nikah",
      "Akte Kelahiran Anak (apabila masih ada anak yang menjadi tanggungan)",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "SK Jabatan Terakhir",
      "Kenaikan Gaji Berkala Terakhir",
      "SKP 2 Tahun Terakhir",
      "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat (dalam 1 tahun terakhir)",
      "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana",
      "Data Perorangan Calon Penerimaan Pensiun (DPCPP)",
      "Buku Tabungan (lembar yang terdapat nomor rekening)",
      "Karis/Karsu",
      "Surat Keterangan Kematian (bila ada)",
      "Surat Keterangan Anak masih sekolah/kuliah (bila terdapat anak yang masih menjadi tanggungan)"
    ]
  },
  "pensiun_janda_duda": {
    label: "Pensiun Janda/Duda (PNS Meninggal)",
    documents: [
      "Surat Permohonan Pensiun dari Janda/Duda Ybs",
      "Foto Janda/Duda Ybs",
      "KTP Janda/Duda",
      "NPWP Janda/Duda",
      "Daftar Susunan Keluarga",
      "Kartu Pegawai",
      "Surat Nikah",
      "Akte Kelahiran Anak (apabila masih ada anak yang menjadi tanggungan)",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "SK Jabatan Terakhir",
      "Kenaikan Gaji Berkala Terakhir",
      "SKP 2 Tahun Terakhir",
      "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat (dalam 1 tahun terakhir)",
      "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana",
      "Data perorangan Calon Penerimaan Pensiun (DPCPP)",
      "Buku Tabungan Janda/Duda (lembar yang terdapat nomor rekening)",
      "Surat Keterangan Kematian Ybs",
      "Surat Keterangan Janda/Duda dari Kelurahan",
      "Karis/Karsu",
      "Surat Keterangan Anak masih sekolah/kuliah (bila terdapat anak yang masih menjadi tanggungan)"
    ]
  },
  "pensiun_anak": {
    label: "Pensiun Anak (PNS dan pasangan meninggal dunia, anak berusia dibawah 25 tahun dan belum berumah tangga)",
    documents: [
      "Surat Permohonan Pensiun dari Anak Ybs",
      "Foto Anak Ybs",
      "KTP Anak",
      "Daftar Susunan Keluarga",
      "Kartu Pegawai",
      "Akte Kelahiran Anak",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "Kenaikan Gaji Berkala Terakhir",
      "SKP 2 Tahun Terakhir",
      "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat (dalam 1 tahun terakhir)",
      "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana",
      "Data perorangan Calon Penerimaan Pensiun (DPCPP)",
      "Buku Tabungan Anak (lembar yang terdapat nomor rekening)",
      "Surat Keterangan Kematian Ybs",
      "Surat Keterangan Kematian Pasangan YBS"
    ]
  },
  "pensiun_tanpa_ahli_waris": {
    label: "PNS Meninggal Tanpa Ahli Waris",
    documents: [
      "Surat Kematian",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "SK Jabatan Terakhir"
    ]
  },
  "pensiun_belum_menikah": {
    label: "PNS Meninggal Status Belum Menikah",
    documents: [
      "Surat Permohonan Pensiun dari Ortu Ybs",
      "Foto Ortu Ybs",
      "KTP Ortu Ybs",
      "Daftar Susunan Keluarga",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "SK Jabatan Terakhir",
      "Data perorangan Calon Penerimaan Pensiun (DPCPP)",
      "Buku Tabungan Ortu (lembar yang terdapat nomor rekening)",
      "Surat Keterangan Kematian Ybs"
    ]
  },
  "pensiun_dini": {
    label: "Pensiun Dini (usia berusia min 45 Tahun dan masa kerja 20 Tahun)",
    documents: [
      "Surat Permohonan Pensiun dari Ybs",
      "Foto Pegawai",
      "KTP",
      "NPWP",
      "Daftar Susunan Keluarga",
      "Kartu Pegawai",
      "Surat Nikah (bila ada)",
      "Akte Kelahiran Anak (apabila masih ada anak yang menjadi tanggungan)",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "SK Jabatan Terakhir",
      "Kenaikan Gaji Berkala Terakhir",
      "SKP 2 Tahun Terakhir",
      "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat (dalam 1 tahun terakhir)",
      "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana",
      "Data perorangan Calon Penerimaan Pensiun (DPCPP)"
    ]
  },
  "pensiun_anumerta": {
    label: "Pensiun Anumerta",
    documents: [
      "Berita Acara (kejadian yang mengakibatkan ybs meninggal dunia)",
      "Visum et repertum",
      "Surat Tugas Ybs",
      "Surat Keterangan (yang menyatakan ybs meninggal karena dinas)",
      "Laporan Dari Pimpinan Unit Kerja (yang menyatakan bahwa ybs meninggal karna dinas)",
      "Kenaikan Pangkat Anumerta Sementara",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "SK Jabatan Terakhir",
      "Kenaikan Gaji Berkala Terakhir",
      "Surat Nikah (bila ada)",
      "Akte Kelahiran Anak (apabila masih ada anak yang menjadi tanggungan)",
      "Foto Janda/Duda Ybs",
      "Buku Tabungan Janda/Duda (lembar yang terdapat nomor rekening)",
      "Surat Keterangan Kematian Ybs",
      "Karis/Karsu",
      "Surat Keterangan Anak masih sekolah/kuliah (bila terdapat anak yang masih menjadi tanggungan)"
    ]
  },
  "masa_pra_pensiun": {
    label: "Masa Pra Pensiun (pengajuan minimal 1 thn s.d 3 bulan sebelum TMT Pensiun)",
    documents: [
      "Surat Permohonan Pensiun dari Ybs",
      "Foto Pegawai",
      "KTP",
      "NPWP",
      "Daftar Susunan Keluarga",
      "Kartu Pegawai",
      "Surat Nikah",
      "Akte Kelahiran Anak (apabila masih ada anak yang menjadi tanggungan)",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "SK Jabatan Terakhir",
      "Kenaikan Gaji Berkala Terakhir",
      "SKP 2 Tahun Terakhir",
      "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat (dalam 1 tahun terakhir)",
      "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana"
    ]
  }
};

export default function PengajuanPensiunBaru() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedKategori, setSelectedKategori] = useState("");
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, [user]);

  const loadEmployees = async () => {
    try {
      let query = supabase
        .from('employees')
        .select('id,nama,nip,tanggal_lahir,tmt_pensiun,unit,jabatan,pangkat,masa_kerja')
        .order('nama');

      if (user?.role === 'admin_unit' && user?.unit) {
        query = query.eq('unit', user.unit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data pegawai: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedEmployee || !selectedKategori) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua data yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const currentYear = new Date().getFullYear();
      const { data: existingApps } = await supabase
        .from('applications')
        .select('id')
        .eq('jenis', 'pensiun')
        .gte('created_at', `${currentYear}-01-01`);

      const sequence = String(existingApps?.length + 1 || 1).padStart(4, '0');
      const nomorUsulan = `PSN/${currentYear}/${sequence}`;

      const applicationData = {
        jenis: 'pensiun' as const,
        judul: `Pengajuan Pensiun - ${selectedEmployee.nama}`,
        submitter_id: user?.id || '',
        submitter_name: user?.name || '',
        submitter_unit: user?.unit || '',
        status: 'draft' as const,
        estimasi: JSON.stringify({
          employee_id: selectedEmployee.id,
          employee_name: selectedEmployee.nama,
          employee_nip: selectedEmployee.nip,
          kategori: selectedKategori,
          kategori_name: retirementCategories[selectedKategori].label,
          nomor_usulan: nomorUsulan,
          unit: selectedEmployee.unit,
          jabatan: selectedEmployee.jabatan,
          pangkat: selectedEmployee.pangkat
        })
      };

      const { data: insertedApp, error } = await supabase
        .from('applications')
        .insert(applicationData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Draft pengajuan pensiun berhasil dibuat. Silakan lengkapi dokumen persyaratan.",
        variant: "default"
      });

      navigate(`/apps/edit-draft-pensiun/${insertedApp.id}`);

    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan pengajuan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.nama.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    (emp.nip && emp.nip.includes(searchEmployee))
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/apps/pensiun')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Pengajuan Pensiun Baru</h1>
          <p className="text-muted-foreground">
            Buat pengajuan administrasi pensiun pegawai baru
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Pengajuan Pensiun</CardTitle>
          <CardDescription>
            Lengkapi informasi berikut untuk membuat pengajuan pensiun baru
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Employee Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">1. Pilih Pegawai</Label>
            {selectedEmployee ? (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{selectedEmployee.nama}</p>
                        <p className="text-sm text-muted-foreground">
                          NIP: {selectedEmployee.nip || '-'} | {selectedEmployee.unit || '-'} | {selectedEmployee.jabatan || '-'}
                        </p>
                        {selectedEmployee.tmt_pensiun && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-4 h-4" />
                            TMT Pensiun: {new Date(selectedEmployee.tmt_pensiun).toLocaleDateString('id-ID')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedEmployee(null)}>
                      Ubah
                    </Button>
                  </div>
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
                            <TableHead>TMT Pensiun</TableHead>
                            <TableHead>Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEmployees.map((employee) => (
                            <TableRow key={employee.id}>
                              <TableCell className="font-medium">{employee.nama}</TableCell>
                              <TableCell>{employee.nip || '-'}</TableCell>
                              <TableCell>{employee.unit || '-'}</TableCell>
                              <TableCell>
                                {employee.tmt_pensiun
                                  ? new Date(employee.tmt_pensiun).toLocaleDateString('id-ID')
                                  : '-'
                                }
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEmployee(employee);
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

          {/* Category Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">2. Pilih Kategori Pensiun</Label>
            <Select value={selectedKategori} onValueChange={setSelectedKategori}>
              <SelectTrigger className="w-full bg-background border-2 hover:border-primary transition-colors">
                <SelectValue placeholder="Pilih kategori pensiun..." />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={5}
                className="w-[var(--radix-select-trigger-width)] max-h-[400px] bg-popover border shadow-md"
              >
                {Object.entries(retirementCategories).map(([key, value]) => (
                  <SelectItem
                    key={key}
                    value={key}
                    className="cursor-pointer hover:bg-accent"
                  >
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Requirements Preview */}
          {selectedKategori && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">3. Persyaratan Dokumen</Label>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Dokumen yang perlu disiapkan (akan diupload setelah pengajuan dibuat):
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {retirementCategories[selectedKategori].documents.map((doc, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="font-medium text-primary min-w-6">
                          {index + 1}.
                        </span>
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Catatan:</strong> Setelah mengirim pengajuan ini, Anda akan diarahkan ke halaman detail untuk mengupload dokumen persyaratan.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedEmployee(null);
                setSelectedKategori('');
              }}
            >
              Reset
            </Button>
            <Button
              onClick={handleSubmitApplication}
              disabled={loading || !selectedEmployee || !selectedKategori}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Membuat Pengajuan...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Buat Pengajuan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
