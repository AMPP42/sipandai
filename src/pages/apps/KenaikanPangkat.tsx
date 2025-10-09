import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Eye,
  TrendingUp,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from 'react-router-dom';
import DocumentVerificationStatus from "@/components/applications/DocumentVerificationStatus";
import type { Database } from '@/integrations/supabase/types';

type Application = Database['public']['Tables']['applications']['Row'];

export default function KenaikanPangkat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    loadApplications();
  }, [user]);

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

  const getStatusBadge = (app: Application) => {
    const status = app.status;
    const estimasi = app.estimasi ? JSON.parse(app.estimasi) : {};
    const isResubmission = estimasi.is_resubmission || false;

    // Additional status badges for completed workflow
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            Pengajuan Kenaikan Pangkat
          </h1>
          <p className="text-muted-foreground">
            Sistem pengajuan kenaikan pangkat pegawai
          </p>
        </div>
        <Button onClick={() => navigate('/apps/pengajuan-kenaikan-pangkat-baru')}>
          <Plus className="w-4 h-4 mr-2" />
          Buat Pengajuan Baru
        </Button>
      </div>

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
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Memuat data pengajuan...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada pengajuan kenaikan pangkat</p>
              <Button
                className="mt-4"
                onClick={() => navigate('/apps/pengajuan-kenaikan-pangkat-baru')}
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
                              if (app.status === 'draft') {
                                navigate(`/apps/edit-draft-kenaikan-pangkat/${app.id}`);
                              } else if (app.status === 'revision_needed') {
                                navigate(`/apps/edit-perbaikan-kenaikan-pangkat/${app.id}`);
                              } else {
                                navigate(`/detail-kenaikan-pangkat/${app.id}`);
                              }
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
    </div>
  );
}
