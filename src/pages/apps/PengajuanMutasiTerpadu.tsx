import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  FileText, 
  Upload, 
  Download, 
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type Application = Database['public']['Tables']['applications']['Row'];
type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

interface Employee {
  id: string;
  nama: string;
  nip: string;
  unit: string;
  jabatan: string;
  pangkat: string;
}

interface Position {
  id: string;
  unit: string;
  jabatan: string;
  existing: number;
  kebutuhan: number;
  gap: number;
  status: string;
}


const DOCUMENT_REQUIREMENTS = [
  'Surat Pernyataan Lolos Butuh dari PPK Instansi Asal (Asli)',
  'Surat Keterangan Tidak Sedang Menjalani Hukuman Disiplin (Asli)',
  'Surat Keterangan Tidak Sedang Menjalani Tugas Belajar/Ikatan Dinas (Asli)',
  'Surat Keterangan Tidak Mempunyai Hutang Piutang dengan Pihak Bank (Asli)',
  'Surat Pernyataan Bebas Temuan yang Diterbitkan oleh ITJEN (Asli)',
  'ANJAB dan ABK yang ditandatangani oleh PPK Instansi Asal (Bila Pindah Antar Kementerian)',
  'SK CPNS (Fotokopi legalisir)',
  'SK PNS (Fotokopi legalisir)',
  'SK Pangkat Terakhir (Fotokopi legalisir)',
  'SK Jabatan Terakhir (Fotokopi legalisir)',
  'KARPEG (Fotokopi legalisir)',
  'Ijazah dan Transkrip Nilai Universitas (Fotokopi legalisir)',
  'SKP 2 tahun terakhir (Fotokopi legalisir)',
  'Surat permohonan mutasi dari ybs',
  'Daftar Riwayat Hidup (DRH) sesuai Keputusan Kepala BKN Nomor 11 Tahun 2002'
];

export default function PengajuanMutasiTerpadu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [searchPosition, setSearchPosition] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [alasanMutasi, setAlasanMutasi] = useState('');
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadPositions();
    loadApplications();
  }, []);

  const loadEmployees = async () => {
    try {
      console.log('Loading employees for user:', user?.unit);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('nama');
      
      if (error) {
        console.error('Error loading employees:', error);
        throw error;
      }
      console.log('Loaded employees:', data?.length || 0);
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data pegawai: ${error.message}`,
        variant: "destructive"
      });
      setEmployees([]);
    }
  };

  const loadPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .gt('gap', 0)
        .order('unit', { ascending: true });
      
      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error loading positions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data formasi jabatan",
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
        .eq('jenis', 'mutasi_terpadu')
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

  const handleSubmitApplication = async () => {
    if (!selectedEmployee || !selectedPosition || !alasanMutasi.trim()) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua data yang diperlukan",
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
        .eq('jenis', 'mutasi_terpadu')
        .gte('created_at', `${currentYear}-01-01`);
      
      const sequence = String(existingApps?.length + 1 || 1).padStart(4, '0');
      const nomorUsulan = `MT/${currentYear}/${sequence}`;

      const applicationData: ApplicationInsert = {
        jenis: 'mutasi_terpadu' as const,
        judul: `Pengajuan Mutasi Terpadu - ${selectedEmployee.nama}`,
        submitter_id: user?.id || '',
        submitter_name: user?.name || '',
        submitter_unit: user?.unit || '',
        status: 'submitted' as const,
        estimasi: JSON.stringify({
          employee_id: selectedEmployee.id,
          employee_name: selectedEmployee.nama,
          employee_nip: selectedEmployee.nip,
          unit_asal: selectedEmployee.unit,
          position_id: selectedPosition.id,
          unit_tujuan: selectedPosition.unit,
          jabatan_tujuan: selectedPosition.jabatan,
          alasan_mutasi: alasanMutasi,
          nomor_usulan: nomorUsulan
        })
      };

      const { error } = await supabase
        .from('applications')
        .insert(applicationData);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengajuan mutasi terpadu berhasil dibuat",
        variant: "default"
      });

      // Reset form
      setSelectedEmployee(null);
      setSelectedPosition(null);
      setAlasanMutasi('');
      setActiveTab('list');
      await loadApplications();

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'draft': 'secondary',
      'submitted': 'default',
      'in_review': 'outline',
      'approved': 'default',
      'rejected': 'destructive'
    };

    const labels: Record<string, string> = {
      'draft': 'Draft',
      'submitted': 'Diajukan',
      'in_review': 'Dalam Review',
      'approved': 'Disetujui',
      'rejected': 'Ditolak'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredEmployees = employees.filter(emp => 
    emp.nama.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    emp.nip.includes(searchEmployee)
  );

  const filteredPositions = positions.filter(pos => 
    pos.unit.toLowerCase().includes(searchPosition.toLowerCase()) ||
    pos.jabatan.toLowerCase().includes(searchPosition.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/apps')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Pengajuan Mutasi Terpadu</h1>
          <p className="text-muted-foreground">
            Sistem pengajuan mutasi pegawai antar unit kerja
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Buat Pengajuan</TabsTrigger>
          <TabsTrigger value="list">Daftar Pengajuan</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Pengajuan Mutasi Terpadu</CardTitle>
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
                              NIP: {selectedEmployee.nip} | {selectedEmployee.unit} | {selectedEmployee.jabatan}
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
                                <TableHead>Jabatan</TableHead>
                                <TableHead>Aksi</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredEmployees.map((employee) => (
                                <TableRow key={employee.id}>
                                  <TableCell className="font-medium">{employee.nama}</TableCell>
                                  <TableCell>{employee.nip}</TableCell>
                                  <TableCell>{employee.unit}</TableCell>
                                  <TableCell>{employee.jabatan}</TableCell>
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

              {/* Position Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">2. Pilih Formasi Jabatan Tujuan</Label>
                {selectedPosition ? (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">{selectedPosition.jabatan}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedPosition.unit} | Kebutuhan: {selectedPosition.kebutuhan} | Gap: {selectedPosition.gap}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedPosition(null)}>
                          Ubah
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Dialog open={isPositionDialogOpen} onOpenChange={setIsPositionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Pilih Formasi Jabatan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Pilih Formasi Jabatan Tujuan</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4" />
                          <Input
                            placeholder="Cari unit atau jabatan..."
                            value={searchPosition}
                            onChange={(e) => setSearchPosition(e.target.value)}
                          />
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Unit</TableHead>
                                <TableHead>Jabatan</TableHead>
                                <TableHead>Existing</TableHead>
                                <TableHead>Kebutuhan</TableHead>
                                <TableHead>Gap</TableHead>
                                <TableHead>Aksi</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredPositions.map((position) => (
                                <TableRow key={position.id}>
                                  <TableCell>{position.unit}</TableCell>
                                  <TableCell className="font-medium">{position.jabatan}</TableCell>
                                  <TableCell>{position.existing}</TableCell>
                                  <TableCell>{position.kebutuhan}</TableCell>
                                  <TableCell className="font-medium text-destructive">
                                    {position.gap}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedPosition(position);
                                        setIsPositionDialogOpen(false);
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

              {/* Reason */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">3. Alasan Mutasi</Label>
                <Textarea
                  placeholder="Jelaskan alasan mengajukan mutasi pegawai..."
                  value={alasanMutasi}
                  onChange={(e) => setAlasanMutasi(e.target.value)}
                  className="min-h-32"
                />
              </div>

              {/* Document Requirements */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">4. Persyaratan Dokumen</Label>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Dokumen yang perlu disiapkan (akan diupload pada tahap selanjutnya):
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {DOCUMENT_REQUIREMENTS.map((doc, index) => (
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

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedEmployee(null);
                    setSelectedPosition(null);
                    setAlasanMutasi('');
                  }}
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSubmitApplication}
                  disabled={loading || !selectedEmployee || !selectedPosition || !alasanMutasi.trim()}
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
              <CardTitle>Daftar Pengajuan Mutasi Terpadu</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>Memuat data pengajuan...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Belum ada pengajuan mutasi terpadu</p>
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
                      <TableHead>Judul</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                         <TableCell>
                           <div>
                             <p className="font-medium">{app.judul}</p>
                             <p className="text-sm text-muted-foreground">
                               {app.estimasi && JSON.parse(app.estimasi).nomor_usulan}
                             </p>
                           </div>
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
                             onClick={() => navigate(`/detail-mutasi-terpadu/${app.id}`)}
                           >
                             <Eye className="w-4 h-4 mr-2" />
                             Detail
                           </Button>
                         </TableCell>
                      </TableRow>
                    ))}
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