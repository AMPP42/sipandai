import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface RoleChange {
  id: string;
  user_id: string;
  old_role: string | null;
  new_role: string;
  old_unit: string | null;
  new_unit: string | null;
  changed_by: string;
  change_reason: string | null;
  changed_at: string;
  user_name?: string;
  changed_by_name?: string;
}

interface UserRoleHistoryProps {
  userId?: string; // If provided, show history for specific user only
}

export default function UserRoleHistory({ userId }: UserRoleHistoryProps) {
  const [history, setHistory] = useState<RoleChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [userId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_role_history')
        .select('*')
        .order('changed_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        // Get user names
        const userIds = [...new Set([
          ...data.map(h => h.user_id),
          ...data.map(h => h.changed_by).filter(Boolean)
        ])];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

        const enrichedHistory = data.map(h => ({
          ...h,
          user_name: profileMap.get(h.user_id) || 'Unknown User',
          changed_by_name: h.changed_by ? profileMap.get(h.changed_by) || 'Unknown Admin' : 'System'
        }));

        setHistory(enrichedHistory);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Error loading role history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return <Badge variant="outline">-</Badge>;
    
    const badges: Record<string, { color: string; label: string }> = {
      'admin_pusat': { color: 'bg-purple-100 text-purple-700', label: 'Admin Pusat' },
      'admin_unit': { color: 'bg-blue-100 text-blue-700', label: 'Admin Unit' },
    };

    const badge = badges[role] || { color: 'bg-gray-100 text-gray-700', label: role };
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Riwayat Perubahan Role {userId ? '- User Spesifik' : ''}
        </CardTitle>
        <CardDescription>
          Tracking semua perubahan role dan unit kerja user
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50">
                <TableRow>
                  <TableHead className="w-[160px]">Waktu</TableHead>
                  {!userId && <TableHead>User</TableHead>}
                  <TableHead>Role Lama</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Role Baru</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Diubah Oleh</TableHead>
                  <TableHead>Alasan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={userId ? 7 : 8} className="text-center py-8 text-gray-500">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={userId ? 7 : 8} className="text-center py-8 text-gray-500">
                      Belum ada riwayat perubahan role
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm">
                        {format(new Date(item.changed_at), 'dd MMM yyyy HH:mm', { locale: id })}
                      </TableCell>
                      {!userId && (
                        <TableCell className="font-medium">{item.user_name}</TableCell>
                      )}
                      <TableCell>{getRoleBadge(item.old_role)}</TableCell>
                      <TableCell>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </TableCell>
                      <TableCell>{getRoleBadge(item.new_role)}</TableCell>
                      <TableCell className="text-sm">
                        {item.old_unit !== item.new_unit ? (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">{item.old_unit || '-'}</span>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span className="font-medium">{item.new_unit || '-'}</span>
                          </div>
                        ) : (
                          <span>{item.new_unit || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {item.changed_by_name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {item.change_reason || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {history.length > 0 && (
          <div className="text-sm text-gray-500 text-right mt-4">
            Total {history.length} perubahan role
          </div>
        )}
      </CardContent>
    </Card>
  );
}
