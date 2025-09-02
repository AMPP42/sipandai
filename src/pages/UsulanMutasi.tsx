
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Eye,
  Download,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UsulanMutasi {
  id: string;
  nomor_usulan: string;
  nama_pegawai: string;
  nip: string;
  unit_asal: string;
  unit_tujuan: string;
  jenis_mutasi: string;
  alasan_mutasi: string;
  status: string;
  tanggal_usulan: string;
  created_at: string;
}

export default function UsulanMutasi() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usulanList, setUsulanList] = useState<UsulanMutasi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsulanMutasi();
  }, [user]);

  const fetchUsulanMutasi = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('usulan_mutasi')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsulanList(data || []);
    } catch (error) {
      console.error('Error fetching usulan mutasi:', error);
      toast.error('Gagal memuat data usulan mutasi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700">Draft</Badge>;
      case 'diajukan':
        return <Badge className="bg-blue-100 text-blue-700">Diajukan</Badge>;
      case 'dalam_review':
        return <Badge className="bg-yellow-100 text-yellow-700">Dalam Review</Badge>;
      case 'disetujui':
        return <Badge className="bg-green-100 text-green-700">Disetujui</Badge>;
      case 'ditolak':
        return <Badge className="bg-red-100 text-red-700">Ditolak</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-600" />;
      case 'diajukan':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'dalam_review':
        return <Eye className="w-4 h-4 text-yellow-600" />;
      case 'disetujui':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'ditolak':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getJenisMutasiLabel = (jenis: string) => {
    switch (jenis) {
      case 'promosi':
        return 'Promosi';
      case 'rotasi':
        return 'Rotasi';
      case 'demosi':
        return 'Demosi';
      case 'pindah_unit':
        return 'Pindah Unit';
      default:
        return jenis;
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
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
                <FileText className="w-6 h-6 text-brand-600" />
              </div>
              Usulan Mutasi
            </h1>
            <p className="text-gray-600 mt-2">
              Kelola usulan mutasi kepegawaian Anda
            </p>
          </div>
          <Button 
            className="btn-primary"
            onClick={() => navigate('/usulan-mutasi/buat')}
          >
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
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {usulanList.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-3xl font-bold text-gray-600 mt-2">
                  {usulanList.filter(u => u.status === 'draft').length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Diproses</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {usulanList.filter(u => ['diajukan', 'dalam_review'].includes(u.status)).length}
                </p>
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
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {usulanList.filter(u => u.status === 'disetujui').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usulan List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Usulan Mutasi</CardTitle>
          <CardDescription>
            Kelola dan pantau status usulan mutasi Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usulanList.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum ada usulan mutasi
              </h3>
              <p className="text-gray-600 mb-4">
                Mulai buat usulan mutasi pertama Anda
              </p>
              <Button onClick={() => navigate('/usulan-mutasi/buat')}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Usulan Baru
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Usulan</TableHead>
                  <TableHead>Nama Pegawai</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Jenis Mutasi</TableHead>
                  <TableHead>Unit Asal → Tujuan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Usulan</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usulanList.map((usulan) => (
                  <TableRow key={usulan.id}>
                    <TableCell className="font-medium">{usulan.nomor_usulan}</TableCell>
                    <TableCell>{usulan.nama_pegawai}</TableCell>
                    <TableCell>{usulan.nip}</TableCell>
                    <TableCell>{getJenisMutasiLabel(usulan.jenis_mutasi)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{usulan.unit_asal}</div>
                        <div className="text-gray-500">↓</div>
                        <div>{usulan.unit_tujuan}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(usulan.status)}
                        {getStatusBadge(usulan.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(usulan.tanggal_usulan).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/usulan-mutasi/${usulan.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {usulan.status === 'draft' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/usulan-mutasi/${usulan.id}/edit`)}
                          >
                            <FileText className="w-4 h-4" />
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
