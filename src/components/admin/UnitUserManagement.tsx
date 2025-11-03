import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

interface UnitUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  status: string;
  created_at: string;
}

export default function UnitUserManagement() {
  const { user, isAdminPusat } = useAuth();
  const [unitUsers, setUnitUsers] = useState<UnitUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UnitUser | null>(null);
  const [actionType, setActionType] = useState<'promote' | 'demote' | null>(null);

  useEffect(() => {
    loadUnitUsers();
  }, [user]);

  const loadUnitUsers = async () => {
    if (!user?.work_unit_id) return;

    try {
      // Get all users from the same work unit
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, name, status, created_at')
        .eq('work_unit_id', user.work_unit_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);

          return {
            ...profile,
            roles: rolesData?.map((r) => r.role) || []
          };
        })
      );

      setUnitUsers(usersWithRoles);
    } catch (error: any) {
      toast.error('Gagal memuat user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteDemote = async () => {
    if (!selectedUser || !actionType || !isAdminPusat) return;

    try {
      if (actionType === 'promote') {
        const { error } = await supabase.rpc('promote_to_admin_unit', {
          target_user_id: selectedUser.id
        });
        if (error) throw error;
        toast.success('User berhasil dipromosikan menjadi Admin Unit');
      } else {
        const { error } = await supabase.rpc('demote_from_admin_unit', {
          target_user_id: selectedUser.id
        });
        if (error) throw error;
        toast.success('User berhasil diturunkan dari Admin Unit');
      }

      setSelectedUser(null);
      setActionType(null);
      loadUnitUsers();
    } catch (error: any) {
      toast.error('Gagal memproses: ' + error.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Kelola User Unit
            {user?.work_unit_id && (
              <Badge variant="outline">Unit: {user.work_unit_id}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unitUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada user di unit ini
            </div>
          ) : (
            <div className="space-y-3">
              {unitUsers.map((unitUser) => {
                const isAdminUnit = unitUser.roles.includes('admin_unit');
                const canPromoteDemote = isAdminPusat && unitUser.id !== user?.id;

                return (
                  <div
                    key={unitUser.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{unitUser.name}</h3>
                        <div className="flex gap-1">
                          {unitUser.roles.map((role) => (
                            <Badge
                              key={role}
                              variant="outline"
                              className={
                                role === 'admin_pusat'
                                  ? 'bg-purple-50 text-purple-700'
                                  : role === 'admin_unit'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-gray-50 text-gray-700'
                              }
                            >
                              {role === 'admin_pusat'
                                ? 'Admin Pusat'
                                : role === 'admin_unit'
                                ? 'Admin Unit'
                                : 'User Unit'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{unitUser.email}</p>
                    </div>

                    {canPromoteDemote && (
                      <div className="flex gap-2">
                        {!isAdminUnit ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedUser(unitUser);
                              setActionType('promote');
                            }}
                          >
                            <Shield className="w-4 h-4 mr-1" />
                            Jadikan Admin Unit
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-orange-600 hover:bg-orange-50"
                            onClick={() => {
                              setSelectedUser(unitUser);
                              setActionType('demote');
                            }}
                          >
                            <ShieldOff className="w-4 h-4 mr-1" />
                            Turunkan dari Admin Unit
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={() => {
          setSelectedUser(null);
          setActionType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'promote' ? 'Promosikan' : 'Turunkan'} User
            </DialogTitle>
            <DialogDescription>
              {actionType === 'promote'
                ? `Apakah Anda yakin ingin menjadikan ${selectedUser?.name} sebagai Admin Unit? User ini akan dapat mengelola user dan memverifikasi usulan di unit mereka.`
                : `Apakah Anda yakin ingin menurunkan ${selectedUser?.name} dari Admin Unit? User ini akan kembali menjadi User Unit biasa.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedUser(null);
                setActionType(null);
              }}
            >
              Batal
            </Button>
            <Button onClick={handlePromoteDemote} className="btn-primary">
              Ya, {actionType === 'promote' ? 'Promosikan' : 'Turunkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
