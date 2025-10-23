
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
  Search,
  Upload,
  Activity,
  History,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import BulkUserImport from '@/components/users/BulkUserImport';
import UserActivityLogs from '@/components/users/UserActivityLogs';
import UserRoleHistory from '@/components/users/UserRoleHistory';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface UserProfile {
  id: string;
  name: string;
  role: string;
  unit: string | null;
  status?: string;
  approved_at?: string | null;
  approved_by?: string | null;
  rejection_reason?: string | null;
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
  pendingRequests: number;
}

interface RegistrationRequest {
  id: string;
  email: string;
  name: string;
  requested_role: string;
  requested_unit: string | null;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    adminPusat: 0,
    adminUnit: 0,
    activeToday: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
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
    loadRegistrationRequests();
  }, []);

  const loadRegistrationRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('user_registration_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      setRegistrationRequests(data || []);
      
      // Update pending count in stats
      const pendingCount = data?.filter(r => r.status === 'pending').length || 0;
      setStats(prev => ({ ...prev, pendingRequests: pendingCount }));
    } catch (error) {
      console.error('Error loading registration requests:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, unit, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles from user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, unit');

      if (rolesError) throw rolesError;

      // Get current user session info
      const { data: { session } } = await supabase.auth.getSession();
      
      // Create a map of user roles
      const rolesMap = new Map(userRoles?.map(ur => [ur.user_id, ur]) || []);

      // Combine profile data with role data
      const enrichedUsers: UserProfile[] = profiles?.map(profile => {
        const isCurrentUser = profile.id === session?.user?.id;
        const roleData = rolesMap.get(profile.id);
        
        return {
          ...profile,
          role: roleData?.role || 'admin_unit',
          unit: roleData?.unit || profile.unit,
          email: isCurrentUser ? session?.user?.email || 'Email tidak tersedia' : 'Email tidak tersedia',
          last_sign_in_at: isCurrentUser ? session?.user?.last_sign_in_at || null : null,
          email_confirmed_at: isCurrentUser ? session?.user?.email_confirmed_at || null : profile.created_at
        };
      }) || [];

      setUsers(enrichedUsers);

      // Calculate stats
      const totalUsers = enrichedUsers.length;
      const adminPusat = enrichedUsers.filter(u => u.role === 'admin_pusat').length;
      const adminUnit = enrichedUsers.filter(u => u.role === 'admin_unit').length;
      
      // Active today - users who have accounts (simplified since we can't access auth data)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Active today - users who have accounts (simplified since we can't access auth data)
      const activeToday = enrichedUsers.filter(u => 
        u.email_confirmed_at && new Date(u.email_confirmed_at) >= today
      ).length;

      setStats({
        totalUsers,
        adminPusat,
        adminUnit,
        activeToday,
        pendingRequests: 0 // Will be loaded separately
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
      // Validate required fields
      if (!newUser.name || !newUser.email || !newUser.role) {
        toast({
          title: "Error",
          description: "Nama, email, dan role harus diisi",
          variant: "destructive"
        });
        return;
      }

      // Check if user with same name already exists
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('name')
        .eq('name', newUser.name);

      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: "Error", 
          description: "User dengan nama tersebut sudah ada dalam sistem",
          variant: "destructive"
        });
        return;
      }

      console.log('Creating new user profile:', {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        unit: newUser.unit
      });

      // Generate a new UUID for the user profile
      const userId = crypto.randomUUID();
      
      // Create user profile in profiles table (with deprecated role field for compatibility)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          name: newUser.name,
          role: newUser.role, // Kept for backward compatibility
          unit: newUser.unit || null
        }])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // Create role in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role: newUser.role as 'admin_pusat' | 'admin_unit',
          unit: newUser.unit || null
        }]);

      if (roleError) {
        console.error('Role creation error:', roleError);
        // Rollback profile creation
        await supabase.from('profiles').delete().eq('id', userId);
        throw roleError;
      }

      console.log('User profile and role created successfully:', profileData);

      toast({
        title: "Berhasil",
        description: `Profile user ${newUser.name} berhasil ditambahkan. User perlu mendaftar dengan email ${newUser.email} untuk dapat login.`
      });

      // Reset form and close dialog
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'admin_unit',
        unit: ''
      });
      setIsCreateDialogOpen(false);
      
      // Reload users list
      loadUsers();

    } catch (error: any) {
      console.error('Error creating user:', error);
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
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: editingUser.name,
          unit: editingUser.unit
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Update role in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({
          role: editingUser.role as 'admin_pusat' | 'admin_unit',
          unit: editingUser.unit
        })
        .eq('user_id', editingUser.id);

      if (roleError) throw roleError;

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

  const approveRegistration = async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('approve_user_registration', {
        request_id: requestId,
        admin_user_id: user.id
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Pendaftaran berhasil disetujui. User akan menerima notifikasi.`
      });

      loadRegistrationRequests();
      loadUsers();
      setIsApprovalDialogOpen(false);
      setSelectedRequest(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyetujui pendaftaran",
        variant: "destructive"
      });
    }
  };

  const rejectRegistration = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Alasan penolakan harus diisi",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('reject_user_registration', {
        request_id: requestId,
        admin_user_id: user.id,
        reason: rejectionReason
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pendaftaran ditolak"
      });

      loadRegistrationRequests();
      setIsApprovalDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menolak pendaftaran",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;

    try {
      toast({
        title: "Info",
        description: "Fitur penghapusan user memerlukan implementasi server-side. Silakan hubungi administrator sistem.",
        variant: "default"
      });
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
    switch (user.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Aktif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Menunggu Persetujuan</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Ditolak</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-700">Ditangguhkan</Badge>;
      default:
        if (user.email_confirmed_at || user.email !== 'N/A') {
          return <Badge className="bg-green-100 text-green-700">Aktif</Badge>;
        }
        return <Badge className="bg-yellow-100 text-yellow-700">Terdaftar</Badge>;
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Update profile status directly
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          approved_at: new Date().toISOString(),
          approved_by: currentUser?.id
        } as any)
        .eq('id', userId);

      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: "User berhasil disetujui",
        variant: "default"
      });
      loadUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: "Gagal menyetujui user: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleRejectUser = async (userId: string, reason: string) => {
    try {
      // Update profile status directly
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'rejected',
          rejection_reason: reason
        } as any)
        .eq('id', userId);

      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: "User berhasil ditolak",
        variant: "default"
      });
      loadUsers();
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: "Gagal menolak user: " + error.message,
        variant: "destructive"
      });
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                loadUsers();
                loadRegistrationRequests();
              }}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsBulkImportOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
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

      {/* Tabs for different views */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Daftar User
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="w-4 h-4" />
            Approval Request
            {stats.pendingRequests > 0 && (
              <Badge className="ml-2 bg-red-500">{stats.pendingRequests}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            Role History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
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
                  <TableHead className="text-right">Aksi</TableHead>
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
                        ? new Date(user.last_sign_in_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : (user.email && user.email !== 'N/A') ? 'Sedang Login' : 'Belum ada data login'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        {user.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleApproveUser(user.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Setujui
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                const reason = prompt('Alasan penolakan:');
                                if (reason) handleRejectUser(user.id, reason);
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Tolak
                            </Button>
                          </>
                        )}
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
        </TabsContent>

        {/* Registration Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Approval Pendaftaran User</CardTitle>
              <CardDescription>
                Kelola dan setujui permintaan pendaftaran user baru
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
                    <TableHead>Tanggal Request</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrationRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Tidak ada permintaan pendaftaran
                      </TableCell>
                    </TableRow>
                  ) : (
                    registrationRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.name}</TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>{getRoleBadge(request.requested_role)}</TableCell>
                        <TableCell>{request.requested_unit || '-'}</TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {request.status === 'approved' && (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Disetujui
                            </Badge>
                          )}
                          {request.status === 'rejected' && (
                            <Badge className="bg-red-100 text-red-700">
                              <XCircle className="w-3 h-3 mr-1" />
                              Ditolak
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(request.requested_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        </TableCell>
                        <TableCell className="text-right">
                          {request.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => approveRegistration(request.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Setuju
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setIsApprovalDialogOpen(true);
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Tolak
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="activity">
          <UserActivityLogs />
        </TabsContent>

        {/* Role History Tab */}
        <TabsContent value="history">
          <UserRoleHistory />
        </TabsContent>
      </Tabs>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
        <DialogContent className="max-w-3xl">
          <BulkUserImport 
            onUploadComplete={() => {
              loadUsers();
              setIsBulkImportOpen(false);
            }}
            onClose={() => setIsBulkImportOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pendaftaran</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk {selectedRequest?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Alasan Penolakan</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Jelaskan alasan penolakan..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsApprovalDialogOpen(false);
              setRejectionReason('');
              setSelectedRequest(null);
            }}>
              Batal
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedRequest && rejectRegistration(selectedRequest.id)}
            >
              Tolak Pendaftaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
