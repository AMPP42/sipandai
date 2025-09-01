
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserCheck, 
  Plus, 
  TrendingUp,
  Building,
  Users,
  CheckCircle
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminFormasi() {
  const formasiData = [
    {
      id: 'FOR001',
      unit: 'Dinas Pendidikan',
      jabatan: 'Guru SD',
      existing: 45,
      kebutuhan: 52,
      gap: 7,
      status: 'dibutuhkan'
    },
    {
      id: 'FOR002',
      unit: 'BKPSDM',
      jabatan: 'Analis SDM',
      existing: 8,
      kebutuhan: 8,
      gap: 0,
      status: 'terpenuhi'
    },
    {
      id: 'FOR003',
      unit: 'Dinas Kesehatan',
      jabatan: 'Dokter Spesialis',
      existing: 12,
      kebutuhan: 18,
      gap: 6,
      status: 'dibutuhkan'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'terpenuhi':
        return <Badge className="bg-green-100 text-green-700">Terpenuhi</Badge>;
      case 'dibutuhkan':
        return <Badge className="bg-red-100 text-red-700">Dibutuhkan</Badge>;
      case 'berlebih':
        return <Badge className="bg-yellow-100 text-yellow-700">Berlebih</Badge>;
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
                <UserCheck className="w-6 h-6 text-brand-600" />
              </div>
              Formasi Jabatan
            </h1>
            <p className="text-gray-600 mt-2">
              Kelola formasi dan kebutuhan jabatan di setiap unit kerja
            </p>
          </div>
          <Button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Formasi
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Formasi</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">147</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terpenuhi</p>
                <p className="text-3xl font-bold text-green-600 mt-2">89</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dibutuhkan</p>
                <p className="text-3xl font-bold text-red-600 mt-2">58</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unit Kerja</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">23</p>
              </div>
              <Building className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formasi Table */}
      <Card>
        <CardHeader>
          <CardTitle>Analisis Formasi Jabatan</CardTitle>
          <CardDescription>
            Analisis kebutuhan dan gap formasi jabatan per unit kerja
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit Kerja</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Existing</TableHead>
                <TableHead>Kebutuhan</TableHead>
                <TableHead>Gap</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formasiData.map((formasi) => (
                <TableRow key={formasi.id}>
                  <TableCell className="font-medium">{formasi.unit}</TableCell>
                  <TableCell>{formasi.jabatan}</TableCell>
                  <TableCell>{formasi.existing}</TableCell>
                  <TableCell>{formasi.kebutuhan}</TableCell>
                  <TableCell className={formasi.gap > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                    {formasi.gap > 0 ? `+${formasi.gap}` : formasi.gap}
                  </TableCell>
                  <TableCell>{getStatusBadge(formasi.status)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              Proyeksi Kebutuhan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Analisis proyeksi kebutuhan pegawai berdasarkan data pensiun dan pertumbuhan organisasi
            </p>
            <Button className="btn-secondary w-full">
              Lihat Proyeksi
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              Laporan Formasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Generate laporan analisis formasi dan rekomendasi pengembangan SDM
            </p>
            <Button className="btn-secondary w-full">
              Generate Laporan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
