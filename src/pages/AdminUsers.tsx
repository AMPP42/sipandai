
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Key,
  Edit,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  Search
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UserProfile {
  id: string;
  name: string;
  role: string;
  unit: string | null;
  created_at: string;
  updated_at: string;
  email?: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
}

interface UserStats {
  totalUsers: number;
  adminPusat: number;
  adminUnit: number;
  activeToday: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    adminPusat: 0,
    adminUnit: 0,
    activeToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin_unit',
    unit: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get auth users for additional info (admin only)
      let authUsers: any[] = [];
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
          console.warn('Cannot fetch auth users:', authError);
        } else {
          authUsers = authData?.users || [];
        }
      } catch (error) {
        console.warn('Auth admin functions not available:', error);
      }

      // Combine profile and auth data
      const enrichedUsers: UserProfile[] = profiles?.map(profile => {
        const authUser = authUsers.find(user => user.id === profile.id);
        return {
          ...profile,
          email: authUser?.email || 'N/A',
          last_sign_in_at: authUser?.last_sign_in_at || null,
          email_confirmed_at: authUser?.email_confirmed_at || null
        };
      }) || [];

      setUsers(enrichedUsers);

      // Calculate stats
      const totalUsers = enrichedUsers.length;
      const adminPusat = enrichedUsers.filter(u => u.role === 'admin_pusat').length;
      const adminUnit = enrichedUsers.filter(u => u.role === 'admin_unit').length;
      
      // Active today (users who signed in today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeToday = enrichedUsers.filter(u => 
        u.last_sign_in_at && new Date(u.last_sign_in_at) >= today
      ).length;

      setStats({
        totalUsers,
        adminPusat,
        adminUnit,
        activeToday
      });

    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: {
          name: newUser.name,
          role: newUser.role,
          unit: newUser.unit
        }
      });

      if (authError) throw authError;

      // Profile will be created automatically by trigger
      toast({
        title: "Berhasil",
        description: "User berhasil dibuat"
      });

      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'admin_unit',
        unit: ''
      });
      setIsCreateDialogOpen(false);
      loadUsers();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat user",
        variant: "destructive"
      });
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editingUser.name,
          role: editingUser.role,
          unit: editingUser.unit
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data user berhasil diperbarui"
      });

      setIsEditDialogOpen(false);
      setEditingUser(null);
      loadUsers();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui user",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "User berhasil dihapus"
      });

      loadUsers();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus user",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.unit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getStatusBadge = (user: UserProfile) => {
    if (user.email_confirmed_at) {
      return <Badge className="bg-green-100 text-green-700">Aktif</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700">Belum Verifikasi</Badge>;
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={loadUsers} 
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Tambah User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah User Baru</DialogTitle>
                  <DialogDescription>
                    Buat akun pengguna baru untuk sistem SIPANDAI
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="user@pemkab.go.id"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin_unit">Admin Unit</SelectItem>
                        <SelectItem value="admin_pusat">Admin Pusat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit Kerja</Label>
                    <Input
                      id="unit"
                      value={newUser.unit}
                      onChange={(e) => setNewUser({...newUser, unit: e.target.value})}
                      placeholder="Nama unit kerja"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={createUser}>
                    Buat User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cari berdasarkan nama, email, atau unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
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
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.adminPusat}</p>
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
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.adminUnit}</p>
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
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeToday}</p>
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
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : (
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
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{user.unit || '-'}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell>
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString('id-ID')
                        : 'Belum pernah login'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingUser(user);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Perbarui informasi pengguna
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nama Lengkap</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value) => setEditingUser({...editingUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_unit">Admin Unit</SelectItem>
                    <SelectItem value="admin_pusat">Admin Pusat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-unit">Unit Kerja</Label>
                <Input
                  id="edit-unit"
                  value={editingUser.unit || ''}
                  onChange={(e) => setEditingUser({...editingUser, unit: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={updateUser}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
