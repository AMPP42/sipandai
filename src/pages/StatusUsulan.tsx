
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle,
  Eye,
  Download,
  MessageSquare,
  AlertCircle,
  Edit,
  Plus
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Application {
  id: string;
  jenis: string;
  judul?: string;
  submitter_name?: string;
  submitter_unit?: string;
  tanggal_pengajuan?: string;
  created_at: string;
  status: string;
  keterangan?: string;
  estimasi?: string;
  progress: number;
}

export default function StatusUsulan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    revision: 0
  });

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  const loadApplications = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load applications (pension etc.) for current user
      const { data: applicationsData, error } = await supabase
        .from('applications')
        .select('*')
        .eq('submitter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedData: Application[] = (applicationsData || []).map(app => ({
        id: app.id,
        jenis: getApplicationTypeName(app.jenis),
        judul: app.judul,
        submitter_name: app.submitter_name,
        submitter_unit: app.submitter_unit,
        tanggal_pengajuan: app.tanggal_pengajuan,
        created_at: app.created_at,
        status: app.status,
        keterangan: getStatusDescription(app.status),
        estimasi: getEstimation(app.status),
        progress: getProgress(app.status)
      }));

      setApplications(mappedData);
      
      // Calculate stats
      const total = mappedData.length;
      const pending = mappedData.filter(app => ['submitted', 'in_review'].includes(app.status)).length;
      const approved = mappedData.filter(app => app.status === 'approved').length;
      const revision = mappedData.filter(app => app.status === 'revision_needed').length;
      
      setStats({ total, pending, approved, revision });

    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data usulan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getApplicationTypeName = (jenis: string) => {
    switch (jenis) {
      case 'pensiun':
        return 'Pengajuan Pensiun';
      case 'mutasi':
        return 'Pengajuan Mutasi';
      case 'kenaikan_pangkat':
        return 'Kenaikan Pangkat';
      default:
        return jenis || 'Lainnya';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Masih dalam tahap penyusunan';
      case 'submitted':
        return 'Menunggu verifikasi dokumen';
      case 'in_review':
        return 'Sedang direview oleh admin pusat';
      case 'revision_needed':
        return 'Dokumen perlu diperbaiki';
      case 'approved':
        return 'Usulan telah disetujui';
      case 'rejected':
        return 'Usulan ditolak';
      default:
        return 'Status tidak dikenal';
    }
  };

  const getEstimation = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Belum diajukan';
      case 'submitted':
        return '3-5 hari kerja';
      case 'in_review':
        return '2-3 hari kerja';
      case 'revision_needed':
        return 'Menunggu revisi';
      case 'approved':
        return 'Selesai';
      case 'rejected':
        return 'Selesai';
      default:
        return '-';
    }
  };

  const getProgress = (status: string) => {
    switch (status) {
      case 'draft':
        return 10;
      case 'submitted':
        return 40;
      case 'in_review':
        return 70;
      case 'revision_needed':
        return 30;
      case 'approved':
        return 100;
      case 'rejected':
        return 100;
      default:
        return 0;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700">Draft</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-700">Menunggu Verifikasi</Badge>;
      case 'in_review':
        return <Badge className="bg-yellow-100 text-yellow-700">Sedang Review</Badge>;
      case 'revision_needed':
        return <Badge className="bg-orange-100 text-orange-700">Perlu Revisi</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">Disetujui</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Ditolak</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-600" />;
      case 'submitted':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'in_review':
        return <Eye className="w-4 h-4 text-yellow-600" />;
      case 'revision_needed':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleEdit = (application: Application) => {
    // Navigate to edit based on application type
    if (application.jenis === 'Pengajuan Pensiun') {
      navigate(`/apps/reminder-pensiun?edit=${application.id}`);
    }
    // Add other application types as needed
  };

  const handleResubmit = async (applicationId: string) => {
    try {
      // Update status to submitted and mark as resubmitted
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'submitted',
          updated_at: new Date().toISOString(),
          // Add a flag to track resubmissions
          keterangan: 'Perbaikan - Diajukan Ulang'
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Usulan berhasil diajukan ulang"
      });

      loadApplications();
    } catch (error) {
      console.error('Error resubmitting:', error);
      toast({
        title: "Error",
        description: "Gagal mengajukan ulang usulan",
        variant: "destructive"
      });
    }
  };

  const getActionButtons = (application: Application) => {
    const canEdit = application.status === 'revision_needed';
    
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" title="Lihat Detail">
          <Eye className="w-4 h-4" />
        </Button>
        
        {canEdit && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleEdit(application)}
            className="text-blue-600 hover:text-blue-700"
            title="Edit Usulan"
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
        
        <Button size="sm" variant="outline" title="Download">
          <Download className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" title="Komentar">
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-lg">
                <Clock className="w-6 h-6 text-brand-600" />
              </div>
              Status Usulan
            </h1>
            <p className="text-gray-600 mt-2">
              Pantau status dan progress usulan yang telah Anda ajukan
            </p>
          </div>
          <Button className="btn-primary" onClick={() => navigate('/apps')}>
            <Plus className="w-4 h-4 mr-2" />
            Buat Usulan Baru
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usulan</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Diproses</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disetujui</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Perlu Revisi</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.revision}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usulan Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Usulan</CardTitle>
          <CardDescription>
            Status dan progress semua usulan yang telah diajukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Usulan</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Tanggal Pengajuan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Estimasi</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Belum ada usulan yang diajukan
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{application.id.slice(0, 8)}</TableCell>
                    <TableCell>{application.jenis}</TableCell>
                    <TableCell>
                      {application.tanggal_pengajuan 
                        ? new Date(application.tanggal_pengajuan).toLocaleDateString('id-ID')
                        : new Date(application.created_at).toLocaleDateString('id-ID')
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(application.status)}
                        {getStatusBadge(application.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-brand-600 h-2 rounded-full" 
                            style={{ width: `${application.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{application.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{application.estimasi}</TableCell>
                    <TableCell>{getActionButtons(application)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Terbaru</CardTitle>
          <CardDescription>
            Aktivitas terbaru terkait usulan Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="font-medium text-blue-900">Usulan USL002 sedang direview</p>
                <p className="text-sm text-blue-700 mt-1">Admin pusat sedang melakukan verifikasi dokumen kenaikan pangkat</p>
                <p className="text-xs text-blue-600 mt-2">2 jam yang lalu</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="font-medium text-green-900">Usulan USL003 telah disetujui</p>
                <p className="text-sm text-green-700 mt-1">Usulan mutasi Anda telah disetujui dan akan diproses lebih lanjut</p>
                <p className="text-xs text-green-600 mt-2">1 hari yang lalu</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="font-medium text-orange-900">Usulan USL004 perlu revisi</p>
                <p className="text-sm text-orange-700 mt-1">Dokumen pendukung perlu dilengkapi sesuai komentar reviewer</p>
                <p className="text-xs text-orange-600 mt-2">3 hari yang lalu</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
