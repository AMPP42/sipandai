import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Filter,
  MessageSquare,
  Check,
  X
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DetailedVerificationModal from '@/components/verifikasi/DetailedVerificationModal';
import { createApplicationStatusNotification } from '@/lib/notifications';

interface ApplicationItem {
  id: string;
  type: 'usulan_mutasi' | 'application';
  nomor_usulan?: string;
  judul?: string;
  nama_pegawai?: string;
  submitter_name?: string;
  unit_asal?: string;
  unit_tujuan?: string;
  submitter_unit?: string;
  jenis_mutasi?: string;
  jenis?: string;
  alasan_mutasi?: string;
  keterangan?: string;
  tanggal_usulan?: string;
  tanggal_pengajuan?: string;
  status: string;
  catatan_reviewer?: string;
  user_id?: string;
  submitter_id?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at?: string;
}

interface VerifikasiProps {
  showResubmittedOnly?: boolean;
}

export default function Verifikasi({ showResubmittedOnly = false }: VerifikasiProps) {
  const { user } = useAuth();
  const [applicationList, setApplicationList] = useState<ApplicationItem[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationItem | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showDetailedVerification, setShowDetailedVerification] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revision'>('approve');
  const [processing, setProcessing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    if (user?.role === 'admin_pusat') {
      loadApplications();
    }
  }, [user]);

  useEffect(() => {
    filterApplications();
  }, [applicationList, filterType, statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      
      // Load usulan_mutasi
      const { data: usulanData, error: usulanError } = await supabase
        .from('usulan_mutasi')
        .select('*')
        .order('created_at', { ascending: false });

      if (usulanError) throw usulanError;

      // Load applications (pensiun, mutasi, kenaikan pangkat, etc.)
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      // Combine and standardize data
      const combinedData: ApplicationItem[] = [
        ...(usulanData || []).map(item => ({
          ...item,
          type: 'usulan_mutasi' as const
        })),
        ...(applicationsData || []).map(item => ({
          ...item,
          type: 'application' as const
        }))
      ];

      // Sort by created_at desc
      combinedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setApplicationList(combinedData);
      
      // Calculate stats
      const total = combinedData.length;
      const pending = combinedData.filter(app => ['submitted', 'in_review'].includes(app.status)).length;
      const approved = combinedData.filter(app => app.status === 'approved').length;
      const rejected = combinedData.filter(app => app.status === 'rejected').length;
      
      setStats({ total, pending, approved, rejected });

    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applicationList;

    // Filter for resubmitted applications if showResubmittedOnly is true
    if (showResubmittedOnly) {
      filtered = filtered.filter(app => 
        app.keterangan?.includes('Perbaikan - Diajukan Ulang') ||
        (app.status === 'submitted' && app.catatan_reviewer)
      );
    }

    // Filter by application type
    if (filterType !== 'all') {
      if (filterType === 'mutasi') {
        // Include both legacy usulan_mutasi and applications with jenis 'mutasi' or 'mutasi_terpadu'
        filtered = filtered.filter(app => 
          app.type === 'usulan_mutasi' || (app.type === 'application' && (app.jenis === 'mutasi' || app.jenis === 'mutasi_terpadu'))
        );
      } else {
        filtered = filtered.filter(app => 
          app.type === 'application' && app.jenis === filterType
        );
      }
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => {
        switch (statusFilter) {
          case 'menunggu_verifikasi':
            return app.status === 'submitted';
          case 'perlu_perbaikan':
            return app.status === 'revision_needed';
          case 'sudah_diperbaiki':
            return app.status === 'submitted' && app.catatan_reviewer;
          case 'diproses':
            return app.status === 'approved';
          case 'disetujui':
            return app.status === 'completed';
          default:
            return true;
        }
      });
    }

    setFilteredApplications(filtered);
  };

  const handleReview = (application: ApplicationItem, action: 'approve' | 'reject' | 'revision') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewNote(application.catatan_reviewer || '');
    setShowReviewDialog(true);
  };

  const submitReview = async () => {
    if (!selectedApplication || !user) return;

    setProcessing(true);
    try {
      let newStatus: 'approved' | 'rejected' | 'revision_needed' | 'in_review';
      switch (reviewAction) {
        case 'approve':
          newStatus = 'approved';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        case 'revision':
          newStatus = 'revision_needed';
          break;
        default:
          newStatus = 'in_review';
      }

      if (selectedApplication.type === 'usulan_mutasi') {
        const { error } = await supabase
          .from('usulan_mutasi')
          .update({
            status: newStatus,
            catatan_reviewer: reviewNote,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', selectedApplication.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('applications')
          .update({
            status: newStatus
          })
          .eq('id', selectedApplication.id);

        if (error) throw error;

        // Log workflow change
        const { error: workflowError } = await supabase
          .from('workflows')
          .insert({
            application_id: selectedApplication.id,
            from_status: selectedApplication.status as 'approved' | 'rejected' | 'draft' | 'submitted' | 'in_review' | 'revision_needed' | 'completed',
            to_status: newStatus,
            actor_id: user.id,
            note: reviewNote
          });

        if (workflowError) console.error('Workflow error:', workflowError);

        // Send notification to the applicant
        const applicationTitle = selectedApplication.judul || `${selectedApplication.jenis || 'Usulan'} - ${selectedApplication.submitter_name}`;
        await createApplicationStatusNotification(
          selectedApplication.submitter_id || selectedApplication.user_id || '',
          applicationTitle,
          selectedApplication.status,
          newStatus,
          reviewNote
        );
      }

      setShowReviewDialog(false);
      setSelectedApplication(null);
      setReviewNote('');
      loadApplications();

    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700">Draft</Badge>;
      case 'submitted':
        return <Badge className="bg-gray-100 text-gray-700">Menunggu Verifikasi</Badge>;
      case 'in_review':
        return <Badge className="bg-orange-100 text-orange-700">Sudah Diperbaiki</Badge>;
      case 'revision_needed':
        return <Badge className="bg-yellow-100 text-yellow-700">Perlu Perbaikan</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-700">Diproses</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Ditolak</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-700">Selesai</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getApplicationName = (app: ApplicationItem) => {
    if (app.type === 'usulan_mutasi') {
      return app.nama_pegawai || '';
    }
    return app.submitter_name || '';
  };

  const getApplicationTitle = (app: ApplicationItem) => {
    if (app.type === 'usulan_mutasi') {
      return app.nomor_usulan || '';
    }
    return app.judul || '';
  };

  const getApplicationType = (app: ApplicationItem) => {
    if (app.type === 'usulan_mutasi') {
      return app.jenis_mutasi || 'Mutasi';
    }
    
    switch (app.jenis) {
      case 'pensiun':
        return 'Pengajuan Pensiun';
      case 'mutasi':
        return 'Pengajuan Mutasi';
      case 'mutasi_terpadu':
        return 'Usulan Mutasi';
      case 'kenaikan_pangkat':
        return 'Kenaikan Pangkat';
      default:
        return app.jenis || 'Lainnya';
    }
  };

  const getApplicationDate = (app: ApplicationItem) => {
    const date = app.tanggal_usulan || app.tanggal_pengajuan || app.created_at;
    return new Date(date).toLocaleDateString('id-ID');
  };

  const getStatusTimestamp = (app: ApplicationItem) => {
    let timestamp: string;
    let label: string;

    switch (app.status) {
      case 'draft':
        timestamp = app.created_at;
        label = 'Dibuat';
        break;
      case 'submitted':
        timestamp = app.tanggal_usulan || app.tanggal_pengajuan || app.created_at;
        label = 'Diajukan';
        break;
      case 'in_review':
        timestamp = app.updated_at || app.created_at;
        label = 'Dalam Review';
        break;
      case 'revision_needed':
        timestamp = app.updated_at || app.created_at;
        label = 'Perlu Revisi';
        break;
      case 'approved':
        timestamp = app.updated_at || app.created_at;
        label = 'Disetujui';
        break;
      case 'rejected':
        timestamp = app.updated_at || app.created_at;
        label = 'Ditolak';
        break;
      case 'completed':
        timestamp = app.updated_at || app.created_at;
        label = 'Selesai';
        break;
      default:
        timestamp = app.created_at;
        label = 'Dibuat';
    }

    const time = new Date(timestamp).toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return `${label}: ${time}`;
  };

  const handleDetailedVerification = (application: ApplicationItem) => {
    setSelectedApplication(application);
    setShowDetailedVerification(true);
  };

  const handleDeleteApplication = async (application: ApplicationItem) => {
    if (!user || user.role !== 'admin_pusat') return;

    if (!confirm(`Apakah Anda yakin ingin menghapus usulan "${getApplicationTitle(application)}"?`)) {
      return;
    }

    setProcessing(true);
    try {
      if (application.type === 'usulan_mutasi') {
        // Delete related documents first
        const { error: docError } = await supabase
          .from('dokumen_usulan')
          .delete()
          .eq('usulan_id', application.id);

        if (docError) throw docError;

        // Delete the usulan_mutasi
        const { error } = await supabase
          .from('usulan_mutasi')
          .delete()
          .eq('id', application.id);

        if (error) throw error;
      } else {
        // Delete related documents and verifications first
        const { error: docVerificationError } = await supabase
          .from('document_verifications')
          .delete()
          .eq('application_id', application.id);

        if (docVerificationError) throw docVerificationError;

        const { error: docError } = await supabase
          .from('documents')
          .delete()
          .eq('application_id', application.id);

        if (docError) throw docError;

        const { error: workflowError } = await supabase
          .from('workflows')
          .delete()
          .eq('application_id', application.id);

        if (workflowError) throw workflowError;

        // Delete the application
        const { error } = await supabase
          .from('applications')
          .delete()
          .eq('id', application.id);

        if (error) throw error;
      }

      loadApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Gagal menghapus usulan. Silakan coba lagi.');
    } finally {
      setProcessing(false);
    }
  };

  const getActionButtons = (application: ApplicationItem) => {
    return (
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => handleDetailedVerification(application)}
          title="Verifikasi Detail"
        >
          <Eye className="w-4 h-4" />
        </Button>
        
        {user?.role === 'admin_pusat' && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleDeleteApplication(application)}
            className="text-red-600 hover:text-red-700"
            title="Hapus Usulan"
            disabled={processing}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  if (user?.role !== 'admin_pusat') {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Akses Ditolak</h2>
          <p className="text-gray-600 mt-2">Halaman ini hanya dapat diakses oleh Admin Pusat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-brand-600" />
              </div>
              Verifikasi Usulan
            </h1>
            <p className="text-gray-600 mt-2">
              Review dan verifikasi usulan yang masuk dari berbagai aplikasi
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-600">{stats.pending}</p>
            <p className="text-sm text-gray-600">Menunggu Review</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
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
                <p className="text-sm font-medium text-gray-600">Menunggu</p>
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
                <p className="text-sm font-medium text-gray-600">Ditolak</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Usulan</CardTitle>
              <CardDescription>
                Kelola dan verifikasi usulan yang masuk dari berbagai aplikasi
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter berdasarkan jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aplikasi</SelectItem>
                  <SelectItem value="pensiun">Pengajuan Pensiun</SelectItem>
                  <SelectItem value="mutasi">Pengajuan Mutasi</SelectItem>
                  <SelectItem value="kenaikan_pangkat">Kenaikan Pangkat</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Filter berdasarkan status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="menunggu_verifikasi">Menunggu Verifikasi</SelectItem>
                  <SelectItem value="perlu_perbaikan">Perlu Perbaikan</SelectItem>
                  <SelectItem value="sudah_diperbaiki">Sudah Diperbaiki</SelectItem>
                  <SelectItem value="diproses">Diproses</SelectItem>
                  <SelectItem value="disetujui">Disetujui</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada usulan yang ditemukan
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor/Judul</TableHead>
                  <TableHead>Nama Pengaju</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Jenis Aplikasi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={`${application.type}-${application.id}`}>
                    <TableCell className="font-medium">
                      {getApplicationTitle(application)}
                    </TableCell>
                    <TableCell>{getApplicationName(application)}</TableCell>
                    <TableCell>
                      {application.type === 'usulan_mutasi' 
                        ? application.unit_asal 
                        : application.submitter_unit}
                    </TableCell>
                    <TableCell>{getApplicationType(application)}</TableCell>
                    <TableCell>
                      <div>
                        <div>{getApplicationDate(application)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getStatusTimestamp(application)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell>{getActionButtons(application)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' && 'Setujui Usulan'}
              {reviewAction === 'reject' && 'Tolak Usulan'}
              {reviewAction === 'revision' && 'Minta Revisi'}
            </DialogTitle>
            <DialogDescription>
              {selectedApplication && `${getApplicationTitle(selectedApplication)} - ${getApplicationName(selectedApplication)}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Catatan {reviewAction === 'approve' ? '(Opsional)' : '*'}
              </label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={
                  reviewAction === 'approve' 
                    ? 'Catatan persetujuan...' 
                    : reviewAction === 'reject'
                    ? 'Alasan penolakan...'
                    : 'Catatan revisi yang diperlukan...'
                }
                className="mt-1"
                required={reviewAction !== 'approve'}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Batal
              </Button>
              <Button 
                onClick={submitReview}
                disabled={processing || (reviewAction !== 'approve' && !reviewNote.trim())}
                className={
                  reviewAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700'
                    : reviewAction === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }
              >
                {processing ? 'Memproses...' : 
                  reviewAction === 'approve' ? 'Setujui' :
                  reviewAction === 'reject' ? 'Tolak' : 'Kirim Revisi'
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detailed Verification Modal */}
      <DetailedVerificationModal
        open={showDetailedVerification}
        onOpenChange={setShowDetailedVerification}
        application={selectedApplication}
        onVerificationComplete={loadApplications}
      />
    </div>
  );
}