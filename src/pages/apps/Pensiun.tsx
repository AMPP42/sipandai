import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from 'react-router-dom';
import DocumentVerificationStatus from "@/components/applications/DocumentVerificationStatus";
import {
  ArrowLeft,
  Plus,
  Eye,
  TrendingUp,
  Loader2,
  FileText,
  Calendar,
  AlertCircle
} from "lucide-react";
import type { Database } from '@/integrations/supabase/types';

type Application = Database['public']['Tables']['applications']['Row'];
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

export default function Pensiun() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const tabParam = urlParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabParam || "reminder");
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchEmployee, setSearchEmployee] = useState("");

  // Keep tab in sync with URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const next = params.get('tab') || 'reminder';
    setActiveTab(next);
  }, [location.search]);

  useEffect(() => {
    loadEmployees();
    if (activeTab === 'list') {
      loadApplications();
    }
  }, [activeTab, user]);

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

  const loadApplications = async () => {
    try {
      setLoading(true);
      console.log('Loading applications for user:', user?.id);

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('jenis', 'pensiun')
        .eq('submitter_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Loaded applications:', data?.length || 0, 'applications');
      console.log('Applications by status:', data?.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));

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

  const getStatusBadge = (app: Application) => {
    const status = app.status;
    const estimasi = app.estimasi ? JSON.parse(app.estimasi) : {};
    const isResubmission = estimasi.is_resubmission || false;

    if (status === 'biro_osdma_submitted' || app.biro_osdma_status === 'submitted') {
      return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">Berkas di Ajukan ke Biro OSDMA</Badge>;
    }
    if (status === 'biro_osdma_review' || app.biro_osdma_status === 'in_progress') {
      return <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">Dalam Review Biro OSDMA</Badge>;
    }
    if (status === 'completed' || app.biro_osdma_status === 'approved') {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Selesai - SK Terbit</Badge>;
    }

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
        'approved': 'Diproses',
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

  const getRetirementDate = (emp: Employee): Date | null => {
    if (emp.tmt_pensiun) return new Date(emp.tmt_pensiun);
    if (emp.tanggal_lahir) {
      const d = new Date(emp.tanggal_lahir);
      d.setFullYear(d.getFullYear() + 60);
      return d;
    }
    return null;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administrasi Pensiun</h1>
          <p className="text-muted-foreground">
            Sistem pengajuan administrasi pensiun pegawai
          </p>
        </div>
        <Button onClick={() => navigate('/apps/pengajuan-pensiun-baru')}>
          <Plus className="w-4 h-4 mr-2" />
          Buat Pengajuan Baru
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        navigate(`/apps/pensiun?tab=${value}`, { replace: true });
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reminder">Reminder Pensiun</TabsTrigger>
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
                const pensiunDate = getRetirementDate(emp);
                if (!pensiunDate) return false;
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
                        const pensiunDate = getRetirementDate(emp);
                        if (!pensiunDate) return false;
                        const today = new Date();
                        const monthsUntilRetirement = (pensiunDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
                        return monthsUntilRetirement > 0 && monthsUntilRetirement <= 12;
                      })
                      .sort((a, b) => {
                        const dateA = getRetirementDate(a);
                        const dateB = getRetirementDate(b);
                        return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
                      })
                      .map((employee) => {
                        const pensiunDate = getRetirementDate(employee);
                        if (!pensiunDate) return null;
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
                              {pensiunDate.toLocaleDateString('id-ID')}
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
                                  // Set employee data and navigate to create form
                                  navigate('/apps/pengajuan-pensiun-baru');
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
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
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p>Memuat data pengajuan...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Belum ada pengajuan pensiun</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Untuk mengakses halaman Edit Perbaikan, Anda perlu memiliki aplikasi dengan status "Perlu Perbaikan"
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate('/apps/pengajuan-pensiun-baru')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
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
                      console.log('Rendering application:', {
                        id: app.id,
                        status: app.status,
                        jenis: app.jenis,
                        estimasi: app.estimasi ? JSON.parse(app.estimasi) : null
                      });

                      let employeeData = {};
                      try {
                        employeeData = app.estimasi ? JSON.parse(app.estimasi) : {};
                      } catch (e) {
                        console.error('Error parsing estimasi:', e);
                      }
                      return (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{(employeeData as any).nomor_usulan || '-'}</p>
                              <p className="text-xs text-muted-foreground">
                                {app.id.slice(0, 8)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{(employeeData as any).employee_name || '-'}</p>
                              <p className="text-sm text-muted-foreground">
                                NIP: {(employeeData as any).employee_nip || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{(employeeData as any).kategori_name || '-'}</p>
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
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const route = app.status === 'draft' ? `/apps/edit-draft-pensiun/${app.id}` :
                                               app.status === 'revision_needed' ? `/apps/edit-perbaikan-pensiun/${app.id}` :
                                               `/detail-pensiun/${app.id}`;

                                  console.log('User clicked application:', {
                                    id: app.id,
                                    status: app.status,
                                    route,
                                    applicationData: app
                                  });

                                  navigate(route);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                {app.status === 'draft' ? 'Edit Draft' :
                                 app.status === 'revision_needed' ? 'Edit Perbaikan' : 'Detail'}
                              </Button>
                            </div>
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
