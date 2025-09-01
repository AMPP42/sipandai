
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  Download,
  Upload,
  Edit,
  Trash2
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminPegawai() {
  const pegawaiData = [
    {
      id: 'PEG001',
      nama: 'Ahmad Susanto',
      nip: '197508121998031005',
      unit: 'Dinas Pendidikan',
      jabatan: 'Kepala Seksi',
      pangkat: 'III/c',
      status: 'aktif'
    },
    {
      id: 'PEG002',
      nama: 'Siti Rahayu',
      nip: '198203152006042010',
      unit: 'BKPSDM',
      jabatan: 'Analis SDM',
      pangkat: 'III/b',
      status: 'aktif'
    },
    {
      id: 'PEG003',
      nama: 'Budi Santoso',
      nip: '196412101990031008',
      unit: 'Dinas Kesehatan',
      jabatan: 'Dokter',
      pangkat: 'IV/a',
      status: 'pensiun'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktif':
        return <Badge className="bg-green-100 text-green-700">Aktif</Badge>;
      case 'cuti':
        return <Badge className="bg-yellow-100 text-yellow-700">Cuti</Badge>;
      case 'pensiun':
        return <Badge className="bg-gray-100 text-gray-700">Pensiun</Badge>;
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
                <Users className="w-6 h-6 text-brand-600" />
              </div>
              Database Pegawai
            </h1>
            <p className="text-gray-600 mt-2">
              Kelola data master pegawai dan informasi kepegawaian
            </p>
          </div>
          <div className="flex gap-3">
            <Button className="btn-secondary">
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
            <Button className="btn-primary">
              <UserPlus className="w-4 h-4 mr-2" />
              Tambah Pegawai
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pegawai</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">2,847</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pegawai Aktif</p>
                <p className="text-3xl font-bold text-green-600 mt-2">2,654</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Akan Pensiun</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">47</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
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
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari pegawai berdasarkan nama, NIP, atau unit..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pegawai Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pegawai</CardTitle>
          <CardDescription>
            Data lengkap pegawai dan informasi kepegawaian
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Unit Kerja</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Pangkat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pegawaiData.map((pegawai) => (
                <TableRow key={pegawai.id}>
                  <TableCell className="font-medium">{pegawai.nama}</TableCell>
                  <TableCell>{pegawai.nip}</TableCell>
                  <TableCell>{pegawai.unit}</TableCell>
                  <TableCell>{pegawai.jabatan}</TableCell>
                  <TableCell>{pegawai.pangkat}</TableCell>
                  <TableCell>{getStatusBadge(pegawai.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
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
