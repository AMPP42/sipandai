
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Key,
  Edit,
  Trash2,
  Lock,
  Unlock
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminUsers() {
  const usersData = [
    {
      id: 'USR001',
      nama: 'Ahmad Susanto',
      email: 'ahmad.susanto@pemkab.go.id',
      role: 'admin_unit',
      unit: 'Dinas Pendidikan',
      status: 'aktif',
      lastLogin: '2024-01-15'
    },
    {
      id: 'USR002',
      nama: 'Siti Rahayu',
      email: 'siti.rahayu@bkpsdm.go.id',
      role: 'admin_pusat',
      unit: 'BKPSDM',
      status: 'aktif',
      lastLogin: '2024-01-14'
    },
    {
      id: 'USR003',
      nama: 'Budi Santoso',
      email: 'budi.santoso@dinkes.go.id',
      role: 'admin_unit',
      unit: 'Dinas Kesehatan',
      status: 'nonaktif',
      lastLogin: '2024-01-10'
    }
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin_pusat':
        return <Badge className="bg-purple-100 text-purple-700">Admin Pusat</Badge>;
      case 'admin_unit':
        return <Badge className="bg-blue-100 text-blue-700">Admin Unit</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktif':
        return <Badge className="bg-green-100 text-green-700">Aktif</Badge>;
      case 'nonaktif':
        return <Badge className="bg-red-100 text-red-700">Nonaktif</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-700">Suspended</Badge>;
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
                <Shield className="w-6 h-6 text-brand-600" />
              </div>
              User Management
            </h1>
            <p className="text-gray-600 mt-2">
              Kelola akun pengguna dan hak akses sistem SIPANDAI
            </p>
          </div>
          <Button className="btn-primary">
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">47</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admin Pusat</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">5</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admin Unit</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">42</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktif Hari Ini</p>
                <p className="text-3xl font-bold text-green-600 mt-2">28</p>
              </div>
              <Key className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            Kelola akun pengguna sistem dan hak akses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nama}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{user.unit}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{new Date(user.lastLogin).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        {user.status === 'aktif' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
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

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-brand-600" />
            Kontrol Akses
          </CardTitle>
          <CardDescription>
            Kelola hak akses dan permission untuk setiap role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Admin Pusat</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Verifikasi semua usulan</li>
                <li>✓ Kelola database pegawai</li>
                <li>✓ Kelola formasi jabatan</li>
                <li>✓ User management</li>
                <li>✓ Statistik & laporan</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Admin Unit</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Akses portal aplikasi</li>
                <li>✓ Status usulan unit</li>
                <li>✓ Pengajuan mutasi</li>
                <li>✓ Pengajuan kenaikan pangkat</li>
                <li>✓ Konsultasi SDM</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
