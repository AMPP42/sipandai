
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  MessageSquare
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Verifikasi() {
  const usulanData = [
    {
      id: 'USL001',
      nama: 'Ahmad Susanto',
      unit: 'Dinas Pendidikan',
      jenis: 'Mutasi',
      tanggal: '2024-01-15',
      status: 'pending',
      dokumen: 5
    },
    {
      id: 'USL002',
      nama: 'Siti Rahayu',
      unit: 'BKPSDM',
      jenis: 'Kenaikan Pangkat',
      tanggal: '2024-01-14',
      status: 'review',
      dokumen: 8
    },
    {
      id: 'USL003',
      nama: 'Budi Santoso',
      unit: 'Dinas Kesehatan',
      jenis: 'Mutasi',
      tanggal: '2024-01-13',
      status: 'approved',
      dokumen: 6
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Menunggu</Badge>;
      case 'review':
        return <Badge className="bg-blue-100 text-blue-700">Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">Disetujui</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Ditolak</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

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
            <p className="text-2xl font-bold text-brand-600">3</p>
            <p className="text-sm text-gray-600">Usulan Baru</p>
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
                <p className="text-3xl font-bold text-gray-900 mt-2">156</p>
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
                <p className="text-3xl font-bold text-yellow-600 mt-2">23</p>
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
                <p className="text-3xl font-bold text-green-600 mt-2">128</p>
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
                <p className="text-3xl font-bold text-red-600 mt-2">5</p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Usulan</TableHead>
                <TableHead>Nama Pegawai</TableHead>
                <TableHead>Unit Kerja</TableHead>
                <TableHead>Jenis Usulan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dokumen</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usulanData.map((usulan) => (
                <TableRow key={usulan.id}>
                  <TableCell className="font-medium">{usulan.id}</TableCell>
                  <TableCell>{usulan.nama}</TableCell>
                  <TableCell>{usulan.unit}</TableCell>
                  <TableCell>{usulan.jenis}</TableCell>
                  <TableCell>{new Date(usulan.tanggal).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{getStatusBadge(usulan.status)}</TableCell>
                  <TableCell>{usulan.dokumen} file</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
