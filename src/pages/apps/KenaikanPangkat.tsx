import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Eye,
  User,
  TrendingUp
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from 'react-router-dom';
import DocumentVerificationStatus from "@/components/applications/DocumentVerificationStatus";
import type { Database } from '@/integrations/supabase/types';

type Application = Database['public']['Tables']['applications']['Row'];
type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

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

export default function KenaikanPangkat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedKategori, setSelectedKategori] = useState("");
  const [selectedPeriode, setSelectedPeriode] = useState("");
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [documentRequirements, setDocumentRequirements] = useState<any[]>([]);

  useEffect(() => {
    loadEmployees();
    loadDocumentRequirements();
    if (activeTab === 'list') {
      loadApplications();
    }
  }, [activeTab, user]);

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

  const loadDocumentRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setDocumentRequirements(data || []);
    } catch (error: any) {
      console.error('Error loading document requirements:', error);
      toast({
        title: "Error",
        description: "Gagal memuat persyaratan dokumen",
        variant: "destructive"
      });
    }
  };

  const loadApplications = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('jenis', 'kenaikan_pangkat')
        .eq('submitter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
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

  const kategoriOptions = {
    "reguler": "Kenaikan Pangkat Reguler (Jabatan Pelaksana)",
    "fungsional": "Kenaikan Pangkat Jabatan Fungsional",
    "struktural": "Kenaikan Pangkat Jabatan Struktural",
    "pertama_kali": "Kenaikan Pangkat Pertama Kali",
    "penyesuaian_ijazah": "Kenaikan Pangkat Penyesuaian Ijazah",
    "iid_ke_iiia": "Kenaikan Pangkat Golongan II/d ke III/a"
  };

  const periodeOptions = [
    "April 2025",
    "Oktober 2025",
    "April 2026",
    "Oktober 2026"
  ];

  const getDocumentRequirements = (kategori: string) => {
    const filtered = documentRequirements.filter(doc => 
      doc.category === `kenaikan_pangkat_${kategori}`
    );
    
    return filtered.map(doc => ({
      nama: doc.name,
      catatan: doc.description
    }));
  };

  const handleSubmitApplication = async () => {
    if (!selectedEmployee || !selectedKategori || !selectedPeriode) {
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
      };

      const { data: insertedApp, error } = await supabase
        .from('applications')
        .insert(applicationData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Draft pengajuan kenaikan pangkat berhasil dibuat. Silakan lengkapi dokumen persyaratan.",
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "warning"> = {
      'draft': 'secondary',
      'submitted': 'default',
      'in_review': 'outline',
      'approved': 'default',
      'rejected': 'destructive',
      'revision_needed': 'warning'
    };

    const labels: Record<string, string> = {
      'draft': 'Draft',
      'submitted': 'Diajukan',
      'in_review': 'Dalam Review',
      'approved': 'Disetujui',
      'rejected': 'Ditolak',
      'revision_needed': 'Perlu perbaikan'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            Pengajuan Kenaikan Pangkat
          </h1>
          <p className="text-muted-foreground">
            Sistem pengajuan kenaikan pangkat pegawai
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
              <div className="space-y-4">
                <Label className="text-base font-semibold">2. Pilih Kategori Kenaikan Pangkat</Label>
                <Select value={selectedKategori} onValueChange={setSelectedKategori}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori kenaikan pangkat" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(kategoriOptions).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Periode Selection */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">3. Pilih Periode Kenaikan Pangkat</Label>
                <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih periode" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodeOptions.map((periode) => (
                      <SelectItem key={periode} value={periode}>
                        {periode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Document Requirements */}
              {selectedKategori && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">4. Persyaratan Dokumen</Label>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Dokumen yang perlu disiapkan (akan diupload pada tahap selanjutnya):
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {getDocumentRequirements(selectedKategori).map((doc, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <span className="font-medium text-primary min-w-6">
                              {index + 1}.
                            </span>
                            <div>
                              <span className="font-medium">{doc.nama}</span>
                              {doc.catatan && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Catatan: {doc.catatan}
                                </p>
                              )}
                            </div>
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
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pengajuan Kenaikan Pangkat</CardTitle>
              <CardDescription>
                Semua pengajuan kenaikan pangkat yang telah dibuat beserta status verifikasi dokumen
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
                  <p className="text-muted-foreground">Belum ada pengajuan kenaikan pangkat</p>
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
                      <TableHead>Periode</TableHead>
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
                            <p className="text-sm">{employeeData.periode || '-'}</p>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(app.status)}
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
