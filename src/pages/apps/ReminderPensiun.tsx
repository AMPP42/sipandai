import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from 'react-router-dom';
import DocumentVerificationStatus from "@/components/applications/DocumentVerificationStatus";
import { 
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Eye,
  User,
  Calendar,
  AlertCircle
} from "lucide-react";
import type { Database } from '@/integrations/supabase/types';

type Application = Database['public']['Tables']['applications']['Row'];
type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

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

export default function ReminderPensiun() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("reminder");
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedKategori, setSelectedKategori] = useState("");
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);

  useEffect(() => {
    loadEmployees();
    if (activeTab === 'list') {
      loadApplications();
    }
  }, [activeTab, user]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .not('tmt_pensiun', 'is', null)
        .order('nama');
      
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

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('jenis', 'pensiun')
        .eq('submitter_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengajuan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const retirementCategories: { [key: string]: { label: string, documents: string[] } } = {
    "pensiun_reguler": {
      label: "Pensiun Reguler",
      documents: [
        "Surat Permohonan Pensiun dari Ybs (tanpa kop unit kerja)",
        "Daftar Susunan Keluarga - pastikan jumlah anak sama dengan di DPCPP",
        "Kartu Pegawai (KARPEG)",
        "Surat Nikah (Optional)",
        "Akte Kelahiran Anak (apabila masih ada anak yang menjadi tanggungan)",
        "SK Pengangkatan sebagai CPNS",
        "SK Pengangkatan CPNS menjadi PNS",
        "SK Kenaikan Pangkat terakhir",
        "Kenaikan Gaji Berkala Terakhir",
        "Penilaian Prestasi Kerja (SKP) 2 Tahun Terakhir",
        "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat dalam 1 Tahun Terakhir",
        "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana",
        "Foto Pegawai ybs",
        "Data Perorangan Calon Penerima Pensiun (DPCPP)",
        "Surat Keterangan Kematian (Bila ada suami/istri yang sudah meninggal dunia)",
        "KTP",
        "NPWP",
        "Buku Tabungan (lembar yang terdapat nomor rekening)",
        "Surat Keterangan Sekolah / Kuliah (bila terdapat anak yang masih menjadi tanggungan)"
      ]
    },
    "pensiun_janda_duda": {
      label: "Pensiun Janda/Duda (PNS Meninggal)",
      documents: [
        "Surat Permohonan Pensiun dari Janda / Duda Ybs (tanpa kop)",
        "Daftar Susunan Keluarga (Dokumen Asli)",
        "Kartu Pegawai (KARPEG) almarhum/ah",
        "Surat Nikah",
        "Akte Kelahiran Anak",
        "SK Pengangkatan sebagai CPNS almarhum/ah",
        "SK Pengangkatan CPNS menjadi PNS almarhum/ah",
        "SK Kenaikan Pangkat almarhum/ah",
        "Gaji Berkala Terakhir almarhum/ah",
        "Penilaian Prestasi Kerja 2 Tahun Terakhir almarhum/ah",
        "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat dalam 1 Tahun Terakhir almarhum/ah",
        "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana almarhum/ah",
        "Data Perorangan Calon Penerima Pensiun (DPCPP)",
        "Foto Janda / Duda ybs",
        "Surat Keterangan Kematian yang Sah (harus dari Dukcapil)",
        "Surat Keterangan Janda / Duda dari Kelurahan",
        "Kartu Istri (KARIS) utk pensiun janda atau Kartu Suami (KARSU) untuk pensiun duda",
        "KTP janda/duda/KK",
        "NPWP janda/duda",
        "Buku Tabungan janda/duda",
        "Surat Keterangan Sekolah / Kuliah (bila terdapat anak yang masih menjadi tanggungan)"
      ]
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
      const nomorUsulan = `PNS/${currentYear}/${sequence}`;

      const applicationData: ApplicationInsert = {
        jenis: 'pensiun' as const,
        judul: `Pengajuan Pensiun - ${selectedEmployee.nama}`,
        submitter_id: user?.id || '',
        submitter_name: user?.name || '',
        submitter_unit: user?.unit || '',
        status: 'draft' as const,
        keterangan: `Kategori: ${retirementCategories[selectedKategori].label}`,
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

      navigate(`/detail-mutasi-terpadu/${insertedApp.id}`);

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

  const getStatusBadge = (app: Application) => {
    const status = app.status;
    const estimasi = app.estimasi ? JSON.parse(app.estimasi) : {};
    const isResubmission = estimasi.is_resubmission || false;
    
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "warning"> = {
      'draft': 'secondary',
      'submitted': 'default',
      'in_review': 'outline',
      'approved': 'default',
      'rejected': 'destructive',
      'revision_needed': 'warning'
    };

    const getLabel = () => {
      if (status === 'submitted') {
        return isResubmission ? 'Menunggu Verifikasi Ulang' : 'Menunggu Verifikasi';
      }
      const labels: Record<string, string> = {
        'draft': 'Draft',
        'in_review': 'Dalam Review',
        'approved': 'Disetujui',
        'rejected': 'Ditolak',
        'revision_needed': 'Perlu Perbaikan'
      };
      return labels[status] || status;
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {getLabel()}
      </Badge>
    );
  };

  const filteredEmployees = employees.filter(emp => 
    emp.nama.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    (emp.nip && emp.nip.includes(searchEmployee))
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/apps')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Pengajuan Administrasi Pensiun</h1>
          <p className="text-muted-foreground">
            Sistem pengajuan administrasi pensiun pegawai
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reminder">Reminder Pensiun</TabsTrigger>
          <TabsTrigger value="create">Buat Pengajuan</TabsTrigger>
          <TabsTrigger value="list">Daftar Pengajuan</TabsTrigger>
        </TabsList>

        <TabsContent value="reminder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Pegawai Yang Akan Memasuki Masa Pensiun
              </CardTitle>
              <CardDescription>
                Daftar pegawai yang akan memasuki masa pensiun dalam 12 bulan ke depan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employees.filter(emp => {
                if (!emp.tmt_pensiun) return false;
                const pensiunDate = new Date(emp.tmt_pensiun);
                const today = new Date();
                const monthsUntilRetirement = (pensiunDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
                return monthsUntilRetirement > 0 && monthsUntilRetirement <= 12;
              }).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Tidak ada pegawai yang akan pensiun dalam 12 bulan ke depan</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Pegawai</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>TMT Pensiun</TableHead>
                      <TableHead>Sisa Waktu</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees
                      .filter(emp => {
                        if (!emp.tmt_pensiun) return false;
                        const pensiunDate = new Date(emp.tmt_pensiun);
                        const today = new Date();
                        const monthsUntilRetirement = (pensiunDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
                        return monthsUntilRetirement > 0 && monthsUntilRetirement <= 12;
                      })
                      .sort((a, b) => {
                        const dateA = a.tmt_pensiun ? new Date(a.tmt_pensiun).getTime() : 0;
                        const dateB = b.tmt_pensiun ? new Date(b.tmt_pensiun).getTime() : 0;
                        return dateA - dateB;
                      })
                      .map((employee) => {
                        const pensiunDate = new Date(employee.tmt_pensiun!);
                        const today = new Date();
                        const daysUntilRetirement = Math.ceil((pensiunDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        const monthsUntilRetirement = Math.floor(daysUntilRetirement / 30);
                        
                        return (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium">{employee.nama}</TableCell>
                            <TableCell>{employee.nip || '-'}</TableCell>
                            <TableCell>{employee.unit || '-'}</TableCell>
                            <TableCell>{employee.jabatan || '-'}</TableCell>
                            <TableCell>
                              {new Date(employee.tmt_pensiun!).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={monthsUntilRetirement <= 3 ? 'destructive' : monthsUntilRetirement <= 6 ? 'warning' : 'default'}
                              >
                                {monthsUntilRetirement} bulan ({daysUntilRetirement} hari)
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setActiveTab('create');
                                }}
                              >
                                Buat Pengajuan
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Pengajuan Pensiun</CardTitle>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori pensiun" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {Object.entries(retirementCategories).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Document Requirements */}
              {selectedKategori && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">3. Persyaratan Dokumen</Label>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Dokumen yang perlu disiapkan (akan diupload pada tahap selanjutnya):
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
                  {loading ? 'Menyimpan...' : 'Buat Pengajuan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pengajuan Pensiun</CardTitle>
              <CardDescription>
                Semua pengajuan pensiun yang telah dibuat beserta status verifikasi dokumen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>Memuat data pengajuan...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Belum ada pengajuan pensiun</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setActiveTab('create')}
                  >
                    Buat Pengajuan Pertama
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor Usulan</TableHead>
                      <TableHead>Pegawai</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Status Dokumen</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {applications.map((app) => {
                       const employeeData = app.estimasi ? JSON.parse(app.estimasi) : {};
                       return (
                       <TableRow key={app.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{employeeData.nomor_usulan || '-'}</p>
                              <p className="text-xs text-muted-foreground">
                                {app.id.slice(0, 8)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{employeeData.employee_name || '-'}</p>
                              <p className="text-sm text-muted-foreground">
                                NIP: {employeeData.employee_nip || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{employeeData.kategori_name || '-'}</p>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(app)}
                          </TableCell>
                          <TableCell>
                            <DocumentVerificationStatus 
                              applicationId={app.id} 
                              applicationStatus={app.status}
                              compact={true}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(app.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/detail-mutasi-terpadu/${app.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Detail
                            </Button>
                          </TableCell>
                       </TableRow>
                       );
                     })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
