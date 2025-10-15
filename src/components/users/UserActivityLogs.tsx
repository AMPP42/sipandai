import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  actor_id: string;
  created_at: string;
  meta: any;
  actor_name?: string;
}

interface UserActivityLogsProps {
  userId?: string; // If provided, show logs for specific user only
}

export default function UserActivityLogs({ userId }: UserActivityLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, [userId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (userId) {
        query = query.eq('actor_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enrich with actor names
      if (data && data.length > 0) {
        const actorIds = [...new Set(data.map(log => log.actor_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', actorIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

        const enrichedLogs = data.map(log => ({
          ...log,
          actor_name: log.actor_id ? profileMap.get(log.actor_id) || 'Unknown' : 'System'
        }));

        setLogs(enrichedLogs);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      'CREATE': { color: 'bg-green-100 text-green-700', label: 'Create' },
      'UPDATE': { color: 'bg-blue-100 text-blue-700', label: 'Update' },
      'DELETE': { color: 'bg-red-100 text-red-700', label: 'Delete' },
      'INSERT': { color: 'bg-green-100 text-green-700', label: 'Insert' },
      'login': { color: 'bg-purple-100 text-purple-700', label: 'Login' },
    };

    const badge = badges[action] || { color: 'bg-gray-100 text-gray-700', label: action };
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      'user': 'User',
      'employees': 'Pegawai',
      'applications': 'Aplikasi',
      'documents': 'Dokumen',
      'profiles': 'Profile',
      'user_roles': 'Role',
    };
    return labels[entity] || entity;
  };

  const filteredLogs = logs.filter(log => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesEntity = filterEntity === 'all' || log.entity === filterEntity;
    const matchesSearch = !searchTerm || 
      log.actor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesAction && matchesEntity && matchesSearch;
  });

  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueEntities = [...new Set(logs.map(log => log.entity))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity Logs {userId ? '- User Spesifik' : '- Semua User'}
        </CardTitle>
        <CardDescription>
          Riwayat aktivitas dan perubahan data sistem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Cari user, entity, atau action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Action</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterEntity} onValueChange={setFilterEntity}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Entity</SelectItem>
              {uniqueEntities.map(entity => (
                <SelectItem key={entity} value={entity}>{getEntityLabel(entity)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadLogs} disabled={loading}>
            <Filter className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Logs Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50">
                <TableRow>
                  <TableHead className="w-[180px]">Waktu</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Tidak ada activity log
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{log.actor_name}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{getEntityLabel(log.entity)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {log.meta ? (
                          <div className="max-w-md truncate">
                            {log.meta.name && <span>Name: {log.meta.name}</span>}
                            {log.meta.role && <span className="ml-2">Role: {log.meta.role}</span>}
                            {log.meta.source && <span className="ml-2 text-xs text-gray-500">({log.meta.source})</span>}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="text-sm text-gray-500 text-right">
          Menampilkan {filteredLogs.length} dari {logs.length} log terakhir
        </div>
      </CardContent>
    </Card>
  );
}
