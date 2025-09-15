
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  FileText, 
  Upload, 
  Download, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  catatan_reviewer?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

interface DokumenUsulan {
  id: string;
  nama_dokumen: string;
  jenis_dokumen: string;
  file_path?: string;
  file_size?: number;
  uploaded_at?: string;
  is_required: boolean;
  status_verifikasi: string;
  catatan_verifikasi?: string;
}

export default function DetailUsulanMutasi() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usulan, setUsulan] = useState<UsulanMutasi | null>(null);
  const [dokumenList, setDokumenList] = useState<DokumenUsulan[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUsulanDetail();
      fetchDokumenList();
    }
  }, [id, user]);

  const fetchUsulanDetail = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('usulan_mutasi')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setUsulan(data);
    } catch (error) {
      console.error('Error fetching usulan detail:', error);
      toast.error('Gagal memuat detail usulan');
      navigate('/usulan-mutasi');
    } finally {
      setLoading(false);
    }
  };

  const fetchDokumenList = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('dokumen_usulan')
        .select('*')
        .eq('usulan_id', id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDokumenList(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleSubmitUsulan = async () => {
    if (!usulan || !id) return;

    try {
      const { error } = await supabase
        .from('usulan_mutasi')
        .update({ status: 'diajukan' })
        .eq('id', id);

      if (error) throw error;

      console.log('Successfully submitted usulan mutasi:', {
        usulanId: id,
        status: 'diajukan'
      });
      
      toast.success('Usulan berhasil diajukan');
      // Navigate to status page after successful submission
      navigate('/status');
    } catch (error) {
      console.error('Error submitting usulan:', error);
      toast.error('Gagal mengajukan usulan');
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
        return <Badge className="bg-blue-100 text-blue-700">Diproses</Badge>;
      case 'ditolak':
        return <Badge className="bg-red-100 text-red-700">Ditolak</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Menunggu</Badge>;
      case 'verified':
        return <Badge className="bg-green-100 text-green-700">Terverifikasi</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Ditolak</Badge>;
      default:
        return <Badge>Unknown</Badge>;
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

  if (!usulan) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Usulan tidak ditemukan
          </h3>
          <Button onClick={() => navigate('/usulan-mutasi')}>
            Kembali ke Daftar Usulan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/usulan-mutasi')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Detail Usulan Mutasi
              </h1>
              <p className="text-gray-600 mt-1">
                {usulan.nomor_usulan}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(usulan.status)}
            {usulan.status === 'draft' && (
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/usulan-mutasi/${usulan.id}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={handleSubmitUsulan}>
                  <Send className="w-4 h-4 mr-2" />
                  Ajukan
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Usulan */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Usulan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-600">Nama Pegawai</Label>
              <p className="mt-1 text-gray-900">{usulan.nama_pegawai}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">NIP</Label>
              <p className="mt-1 text-gray-900">{usulan.nip}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Unit Asal</Label>
              <p className="mt-1 text-gray-900">{usulan.unit_asal}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Unit Tujuan</Label>
              <p className="mt-1 text-gray-900">{usulan.unit_tujuan}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Jenis Mutasi</Label>
              <p className="mt-1 text-gray-900">{getJenisMutasiLabel(usulan.jenis_mutasi)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Tanggal Usulan</Label>
              <p className="mt-1 text-gray-900">
                {new Date(usulan.tanggal_usulan).toLocaleDateString('id-ID')}
              </p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-gray-600">Alasan Mutasi</Label>
              <p className="mt-1 text-gray-900">{usulan.alasan_mutasi}</p>
            </div>
            {usulan.catatan_reviewer && (
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-600">Catatan Reviewer</Label>
                <p className="mt-1 text-gray-900">{usulan.catatan_reviewer}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dokumen */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dokumen Pendukung</CardTitle>
              <CardDescription>
                Upload dan kelola dokumen yang diperlukan untuk usulan mutasi
              </CardDescription>
            </div>
            {usulan.status === 'draft' && (
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Dokumen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {dokumenList.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum ada dokumen
              </h3>
              <p className="text-gray-600">
                Upload dokumen pendukung untuk usulan mutasi
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Dokumen</TableHead>
                  <TableHead>Jenis Dokumen</TableHead>
                  <TableHead>Status Verifikasi</TableHead>
                  <TableHead>Tanggal Upload</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dokumenList.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      {doc.nama_dokumen}
                      {doc.is_required && (
                        <Badge className="ml-2 bg-red-100 text-red-700 text-xs">
                          Wajib
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{doc.jenis_dokumen}</TableCell>
                    <TableCell>{getVerificationBadge(doc.status_verifikasi)}</TableCell>
                    <TableCell>
                      {doc.uploaded_at 
                        ? new Date(doc.uploaded_at).toLocaleDateString('id-ID')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {doc.file_path && (
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        {usulan.status === 'draft' && (
                          <Button size="sm" variant="outline">
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
