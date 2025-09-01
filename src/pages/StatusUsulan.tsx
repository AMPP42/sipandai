
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
  AlertCircle
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StatusUsulan() {
  const usulanData = [
    {
      id: 'USL001',
      jenis: 'Mutasi',
      tanggalPengajuan: '2024-01-10',
      status: 'pending',
      keterangan: 'Menunggu verifikasi dokumen',
      estimasi: '3-5 hari kerja',
      progress: 60
    },
    {
      id: 'USL002',
      jenis: 'Kenaikan Pangkat',
      tanggalPengajuan: '2024-01-08',
      status: 'review',
      keterangan: 'Sedang direview oleh admin pusat',
      estimasi: '2-3 hari kerja',
      progress: 80
    },
    {
      id: 'USL003',
      jenis: 'Mutasi',
      tanggalPengajuan: '2024-01-05',
      status: 'approved',
      keterangan: 'Usulan telah disetujui',
      estimasi: 'Selesai',
      progress: 100
    },
    {
      id: 'USL004',
      jenis: 'Kenaikan Pangkat',
      tanggalPengajuan: '2024-01-03',
      status: 'revision',
      keterangan: 'Dokumen perlu diperbaiki',
      estimasi: 'Menunggu revisi',
      progress: 30
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
      case 'revision':
        return <Badge className="bg-orange-100 text-orange-700">Perlu Revisi</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'review':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'revision':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4" />;
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
                <Clock className="w-6 h-6 text-brand-600" />
              </div>
              Status Usulan
            </h1>
            <p className="text-gray-600 mt-2">
              Pantau status dan progress usulan yang telah Anda ajukan
            </p>
          </div>
          <Button className="btn-primary">
            <FileText className="w-4 h-4 mr-2" />
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
                <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
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
                <p className="text-3xl font-bold text-yellow-600 mt-2">5</p>
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
                <p className="text-3xl font-bold text-green-600 mt-2">7</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Perlu Aksi</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">1</p>
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
              {usulanData.map((usulan) => (
                <TableRow key={usulan.id}>
                  <TableCell className="font-medium">{usulan.id}</TableCell>
                  <TableCell>{usulan.jenis}</TableCell>
                  <TableCell>{new Date(usulan.tanggalPengajuan).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(usulan.status)}
                      {getStatusBadge(usulan.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-brand-600 h-2 rounded-full" 
                          style={{ width: `${usulan.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{usulan.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{usulan.estimasi}</TableCell>
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
