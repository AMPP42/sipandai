import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Search,
  User,
  TrendingUp,
  FileText
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from 'react-router-dom';

interface Employee {
  id: string;
  nama: string;
  nip: string | null;
  unit: string | null;
  jabatan: string | null;
  pangkat: string | null;
  tmt_cpns: string | null;
  tmt_pangkat_terakhir: string | null;
  masa_kerja: string | null;
}

export default function PengajuanKenaikanPangkatBaru() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  // Promotion categories
  const promotionCategories = [
    { id: 'reguler', name: 'Kenaikan Pangkat Reguler (Jabatan Pelaksana)' },
    { id: 'fungsional', name: 'Kenaikan Pangkat Jabatan Fungsional' },
    { id: 'struktural', name: 'Kenaikan Pangkat Jabatan Struktural' },
    { id: 'pertama_kali', name: 'Kenaikan Pangkat Pertama Kali' },
    { id: 'penyesuaian_ijazah', name: 'Kenaikan Pangkat Penyesuaian Ijazah' },
    { id: 'iid_iiia', name: 'Kenaikan Pangkat Golongan II/d ke III/a' }
  ] as const;

  // Document requirements for each promotion category
  const DOCUMENT_REQUIREMENTS = {
    // Kenaikan Pangkat Reguler (Jabatan Pelaksana)
    reguler: [
      'SKP 2 tahun terakhir (Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai")',
      'SK Jabatan terakhir',
      'SK Pangkat terakhir',
      'Kartu Pegawai',
      'Ijazah + Transkrip nilai terakhir',
      'Nota dinas'
    ],
    
    // Kenaikan Pangkat Jabatan Fungsional
    fungsional: [
      'PAK tahun 2022 hingga saat ini (Catatan: Wajib 3 lembar di setiap tahun)',
      'SKP 2 tahun terakhir (Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai")',
      'SK Jabatan terakhir (Catatan: Wajib disertai sertifikat uji kompetensi bagi pegawai yang naik jenjang)',
      'SK Pangkat terakhir',
      'Kartu Pegawai',
      'Ijazah + transkrip nilai terakhir',
      'Nota dinas'
    ],
    
    // Kenaikan Pangkat Jabatan Struktural
    struktural: [
      'SKP 2 tahun terakhir (Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai")',
      'SK Jabatan terakhir',
      'SK Pangkat terakhir',
      'Kartu Pegawai',
      'Ijazah + Transkrip Nilai terakhir',
      'Surat Pernyataan Pelantikan',
      'Surat Pernyataan Melaksanakan Tugas',
      'Surat Pernyataan Menduduki Jabatan',
      'Khusus untuk Pejabat Struktural Eselon III yang pendidikan terakhirnya S1 dan pangkat terakhirnya III/d, wajib lulus diklat PIM III',
      'Nota dinas'
    ],
    
    // Kenaikan Pangkat Pertama Kali
    pertama_kali: [
      'SK CPNS',
      'SK PNS',
      'SKP 2 tahun terakhir (Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai")',
      'PAK tahun 2022 hingga saat ini (Catatan: Khusus untuk jabatan fungsional; Wajib 3 lembar di setiap tahun)',
      'SK Jabatan (Catatan: Khusus untuk jabatan fungsional)',
      'Berita Acara Pengambilan Sumpah Jabatan PNS (Catatan: Khusus untuk jabatan fungsional)',
      'SK Pangkat terakhir',
      'Kartu Pegawai',
      'Ijazah + Transkrip Nilai terakhir',
      'Nota dinas'
    ],
    
    // Kenaikan Pangkat Penyesuaian Ijazah
    penyesuaian_ijazah: [
      'Surat Tanda Lulus Ujian Penyesuaian Kenaikan Pangkat',
      'Ijazah + Transkrip Nilai terakhir yang telah dilegalisir',
      'Uraian Tugas',
      'SKP 2 tahun terakhir (Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai")',
      'SK Jabatan terakhir',
      'SK Pangkat terakhir',
      'Kartu Pegawai',
      'Nota dinas'
    ],
    
    // Kenaikan Pangkat Golongan II/d ke III/a
    iid_iiia: [
      'Surat Tanda Lulus Ujian Dinas',
      'SKP 2 tahun terakhir (Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai")',
      'SK Jabatan terakhir',
      'SK Pangkat terakhir',
      'Ijazah + Transkrip nilai terakhir',
      'Kartu Pegawai',
      'Nota dinas'
    ]
  };

  const [selectedKategori, setSelectedKategori] = useState("");
  const [selectedPeriode, setSelectedPeriode] = useState("");
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, [user]);

  const loadEmployees = async () => {
    try {
      let query = supabase
        .from('employees')
        .select('*')
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
        description: "Gagal memuat data pegawai",
        variant: "destructive"
      });
    }
  };

  const kategoriOptions = {
    "reguler": "Kenaikan Pangkat Reguler (Jabatan Pelaksana)",
    "fungsional": "Kenaikan Pangkat Jabatan Fungsional",
    "struktural": "Kenaikan Pangkat Jabatan Struktural",
    "pertama_kali": "Kenaikan Pangkat Pertama Kali",
    "penyesuaian_ijazah": "Kenaikan Pangkat Penyesuaian Ijazah",
    "iid_ke_iiia": "Kenaikan Pangkat Golongan II/d ke III/a"
  };

  const periodeOptions = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const handleSubmitApplication = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Silakan pilih pegawai terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    if (!selectedKategori || !selectedPeriode) {
      toast({
        title: "Error",
        description: "Silakan lengkapi kategori dan periode kenaikan pangkat",
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
        .eq('jenis', 'kenaikan_pangkat')
        .gte('created_at', `${currentYear}-01-01`);

      const sequence = String(existingApps?.length + 1 || 1).padStart(4, '0');
      const nomorUsulan = `KP/${currentYear}/${sequence}`;

      const { data: insertedApp, error } = await supabase
        .from('applications')
        .insert({
          jenis: 'kenaikan_pangkat' as const,
          judul: `Pengajuan Kenaikan Pangkat - ${selectedEmployee.nama}`,
          submitter_id: user?.id || '',
          submitter_name: user?.name || '',
          submitter_unit: user?.unit || '',
          status: 'draft' as const,
          estimasi: JSON.stringify({
            employee_id: selectedEmployee.id,
            employee_name: selectedEmployee.nama,
            employee_nip: selectedEmployee.nip,
            kategori: selectedKategori,
            kategori_name: kategoriOptions[selectedKategori as keyof typeof kategoriOptions],
            periode: selectedPeriode,
            nomor_usulan: nomorUsulan,
            unit: selectedEmployee.unit,
            jabatan: selectedEmployee.jabatan,
            pangkat: selectedEmployee.pangkat
          })
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Draft pengajuan kenaikan pangkat berhasil dibuat. Silakan lengkapi dokumen persyaratan.",
        variant: "default"
      });

      navigate(`/detail-kenaikan-pangkat/${insertedApp.id}`);

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
        <Button variant="outline" size="sm" onClick={() => navigate('/apps/kenaikan-pangkat')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold">Pengajuan Kenaikan Pangkat Baru</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Pengajuan Kenaikan Pangkat</CardTitle>
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
                        <p className="text-sm text-muted-foreground">
                          Pangkat: {selectedEmployee.pangkat || '-'} | Masa Kerja: {selectedEmployee.masa_kerja || '-'}
                        </p>
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
                            <TableHead>Pangkat</TableHead>
                            <TableHead>Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEmployees.map((employee) => (
                            <TableRow key={employee.id}>
                              <TableCell className="font-medium">{employee.nama}</TableCell>
                              <TableCell>{employee.nip || '-'}</TableCell>
                              <TableCell>{employee.unit || '-'}</TableCell>
                              <TableCell>{employee.pangkat || '-'}</TableCell>
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
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori Kenaikan Pangkat</Label>
              <Select value={selectedKategori} onValueChange={setSelectedKategori}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {promotionCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periode">Periode Kenaikan Pangkat</Label>
              <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  {periodeOptions.map((bulan) => (
                    <SelectItem key={bulan} value={bulan}>
                      {bulan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document upload will be handled in a separate page */}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedEmployee(null);
                setSelectedKategori('');
                setSelectedPeriode('');
              }}
            >
              Reset
            </Button>
            <Button
              onClick={handleSubmitApplication}
              disabled={loading || !selectedEmployee || !selectedKategori || !selectedPeriode}
            >
              {loading ? 'Menyimpan...' : 'Buat Pengajuan'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
