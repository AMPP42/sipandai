
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  MessageSquare,
  Check,
  X
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UsulanMutasi {
  id: string;
  nomor_usulan: string;
  nama_pegawai: string;
  unit_asal: string;
  unit_tujuan: string;
  jenis_mutasi: string;
  alasan_mutasi: string;
  tanggal_usulan: string;
  status: string;
  catatan_reviewer?: string;
  user_id: string;
  created_at: string;
}

export default function Verifikasi() {
  const { user } = useAuth();
  const [usulanList, setUsulanList] = useState<UsulanMutasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsulan, setSelectedUsulan] = useState<UsulanMutasi | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revision'>('approve');
  const [processing, setProcessing] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    if (user?.role === 'admin_pusat') {
      loadUsulan();
    }
  }, [user]);

  const loadUsulan = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usulan_mutasi')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsulanList(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const pending = data?.filter(u => ['submitted', 'in_review'].includes(u.status)).length || 0;
      const approved = data?.filter(u => u.status === 'approved').length || 0;
      const rejected = data?.filter(u => u.status === 'rejected').length || 0;
      
      setStats({ total, pending, approved, rejected });

    } catch (error) {
      console.error('Error loading usulan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (usulan: UsulanMutasi, action: 'approve' | 'reject' | 'revision') => {
    setSelectedUsulan(usulan);
    setReviewAction(action);
    setReviewNote(usulan.catatan_reviewer || '');
    setShowReviewDialog(true);
  };

  const submitReview = async () => {
    if (!selectedUsulan || !user) return;

    setProcessing(true);
    try {
      let newStatus: string;
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

      const { error } = await supabase
        .from('usulan_mutasi')
        .update({
          status: newStatus,
          catatan_reviewer: reviewNote,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedUsulan.id);

      if (error) throw error;

      setShowReviewDialog(false);
      setSelectedUsulan(null);
      setReviewNote('');
      loadUsulan();

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
        return <Badge className="bg-blue-100 text-blue-700">Disubmit</Badge>;
      case 'in_review':
        return <Badge className="bg-yellow-100 text-yellow-700">Review</Badge>;
      case 'revision_needed':
        return <Badge className="bg-orange-100 text-orange-700">Perlu Revisi</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">Disetujui</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Ditolak</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-700">Selesai</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getActionButtons = (usulan: UsulanMutasi) => {
    const canReview = ['submitted', 'in_review'].includes(usulan.status);
    
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" title="Lihat Detail">
          <Eye className="w-4 h-4" />
        </Button>
        
        {canReview && (
          <>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleReview(usulan, 'approve')}
              className="text-green-600 hover:text-green-700"
              title="Setujui"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleReview(usulan, 'revision')}
              className="text-orange-600 hover:text-orange-700"
              title="Minta Revisi"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleReview(usulan, 'reject')}
              className="text-red-600 hover:text-red-700"
              title="Tolak"
            >
              <X className="w-4 h-4" />
            </Button>
          </>
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
              Review dan verifikasi usulan yang masuk dari berbagai unit kerja
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

      {/* Usulan Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Usulan</CardTitle>
          <CardDescription>
            Kelola dan verifikasi usulan yang masuk
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : usulanList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada usulan yang ditemukan
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Usulan</TableHead>
                  <TableHead>Nama Pegawai</TableHead>
                  <TableHead>Unit Asal</TableHead>
                  <TableHead>Unit Tujuan</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usulanList.map((usulan) => (
                  <TableRow key={usulan.id}>
                    <TableCell className="font-medium">{usulan.nomor_usulan}</TableCell>
                    <TableCell>{usulan.nama_pegawai}</TableCell>
                    <TableCell>{usulan.unit_asal}</TableCell>
                    <TableCell>{usulan.unit_tujuan}</TableCell>
                    <TableCell>{usulan.jenis_mutasi}</TableCell>
                    <TableCell>{new Date(usulan.tanggal_usulan).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{getStatusBadge(usulan.status)}</TableCell>
                    <TableCell>{getActionButtons(usulan)}</TableCell>
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
              {selectedUsulan && `Usulan ${selectedUsulan.nomor_usulan} - ${selectedUsulan.nama_pegawai}`}
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
    </div>
  );
}
