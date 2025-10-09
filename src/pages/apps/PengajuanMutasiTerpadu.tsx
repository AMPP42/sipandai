import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  FileText,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';
import DocumentVerificationStatus from '@/components/applications/DocumentVerificationStatus';

type Application = Database['public']['Tables']['applications']['Row'];

interface ApplicationDetail extends Application {
  employee_data?: {
    employee_name: string;
    employee_nip: string;
    unit_tujuan: string;
    jabatan_tujuan: string;
    nomor_usulan: string;
  };
}

export default function PengajuanMutasiTerpadu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<ApplicationDetail[]>([]);

  useEffect(() => {
    loadApplications();
  }, [user]);

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

      // Transform data to include employee_data
      const transformedData = data?.map(app => ({
        ...app,
        employee_data: app.estimasi ? JSON.parse(app.estimasi) : undefined
      })) || [];

      setApplications(transformedData);
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

  const handleDeleteDraft = async (applicationId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus draft ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Draft berhasil dihapus"
      });

      loadApplications();
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus draft",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (app: ApplicationDetail) => {
    const status = app.status;
    const isResubmission = app.keterangan?.includes('Perbaikan - Diajukan Ulang');

    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "warning"> = {
      'draft': 'secondary',
      'submitted': 'default',
      'in_review': 'outline',
      'approved': 'default',
      'biro_osdma_submitted': 'default',
      'biro_osdma_review': 'warning',
      'completed': 'default',
      'rejected': 'destructive',
      'revision_needed': 'warning'
    };

    const getLabel = () => {
      if (status === 'submitted' && isResubmission) {
        return 'Menunggu Verifikasi Ulang';
      }
      const labels: Record<string, string> = {
        'draft': 'Draft',
        'submitted': 'Menunggu Verifikasi',
        'in_review': 'Dalam Review',
        'approved': 'Disetujui & Diproses',
        'biro_osdma_submitted': 'Berkas Diajukan ke Biro OSDMA',
        'biro_osdma_review': 'Menunggu Keputusan',
        'completed': 'SK Telah Terbit',
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

  const getStatusTimestamp = (app: ApplicationDetail) => {
    if (app.status === 'submitted' && app.tanggal_pengajuan) {
      return new Date(app.tanggal_pengajuan).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (app.status === 'revision_needed') {
      return new Date(app.updated_at).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (app.status === 'approved') {
      return new Date(app.updated_at).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (app.status === 'draft') {
      return new Date(app.created_at).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(app.created_at).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/apps')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Daftar Pengajuan Mutasi Terpadu</h1>
            <p className="text-muted-foreground">
              Kelola semua pengajuan mutasi terpadu Anda
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/apps/pengajuan-usulan-baru')}>
          <Plus className="w-4 h-4 mr-2" />
          Buat Pengajuan Baru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semua Pengajuan Mutasi Terpadu</CardTitle>
          <CardDescription>
            Daftar semua pengajuan mutasi terpadu yang telah dibuat beserta statusnya
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
              <p className="text-muted-foreground mb-2">Belum ada pengajuan mutasi terpadu</p>
              <p className="text-sm text-muted-foreground mb-4">
                Buat pengajuan mutasi terpadu pertama Anda
              </p>
              <Button onClick={() => navigate('/apps/pengajuan-usulan-baru')}>
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
                  <TableHead>Unit Tujuan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Status Dokumen</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.employee_data?.nomor_usulan || '-'}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.id.slice(0, 8)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.employee_data?.employee_name || '-'}</p>
                        <p className="text-sm text-muted-foreground">
                          NIP: {app.employee_data?.employee_nip || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{app.employee_data?.unit_tujuan || '-'}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.employee_data?.jabatan_tujuan || '-'}
                        </p>
                      </div>
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
                      {getStatusTimestamp(app)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (app.status === 'draft') {
                              navigate(`/apps/edit-draft-usulan/${app.id}`);
                            } else if (app.status === 'revision_needed') {
                              navigate(`/apps/edit-perbaikan-usulan/${app.id}`);
                            } else {
                              navigate(`/detail-mutasi-terpadu/${app.id}`);
                            }
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {app.status === 'draft' ? 'Edit Draft' :
                           app.status === 'revision_needed' ? 'Edit Perbaikan' : 'Detail'}
                        </Button>
                        {app.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDraft(app.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
