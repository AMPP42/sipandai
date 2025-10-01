import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QueueStats {
  totalWaiting: number;
  averageWaitTime: number;
  activeChats: number;
  availableOfficers: number;
}

interface QueuedSession {
  id: string;
  queue_position: number;
  wait_time_seconds: number;
  priority: string;
  topic: string | null;
  started_at: string;
}

export default function ChatQueue() {
  const [stats, setStats] = useState<QueueStats>({
    totalWaiting: 0,
    averageWaitTime: 0,
    activeChats: 0,
    availableOfficers: 0,
  });
  const [queuedSessions, setQueuedSessions] = useState<QueuedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadQueueData = async () => {
    try {
      // Get waiting sessions
      const { data: waitingSessions, error: waitingError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('status', 'waiting')
        .order('queue_position');

      if (waitingError) throw waitingError;

      // Get active sessions count
      const { count: activeCount } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get available officers
      const { data: availableOfficers } = await supabase
        .from('officer_status')
        .select('*')
        .eq('status', 'online')
        .eq('is_available', true);
      
      // Filter officers who have capacity
      const availableCount = availableOfficers?.filter(
        (officer) => (officer.current_active_chats || 0) < (officer.max_concurrent_chats || 3)
      ).length || 0;

      // Calculate average wait time
      const avgWaitTime = waitingSessions?.length
        ? waitingSessions.reduce((sum, s) => sum + (s.wait_time_seconds || 0), 0) / waitingSessions.length
        : 0;

      setStats({
        totalWaiting: waitingSessions?.length || 0,
        averageWaitTime: Math.round(avgWaitTime),
        activeChats: activeCount || 0,
        availableOfficers: availableCount,
      });

      setQueuedSessions(waitingSessions || []);
    } catch (error) {
      console.error('Error loading queue data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data antrian chat',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueueData();

    // Refresh every 10 seconds
    const interval = setInterval(loadQueueData, 10000);

    // Subscribe to real-time updates
    const channel = supabase
      .channel('queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions',
        },
        () => {
          loadQueueData();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const formatWaitTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'normal':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Antrian</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWaiting}</div>
            <p className="text-xs text-muted-foreground">Menunggu petugas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waktu Tunggu Rata-rata</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatWaitTime(stats.averageWaitTime)}</div>
            <p className="text-xs text-muted-foreground">Estimasi waktu tunggu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Aktif</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeChats}</div>
            <p className="text-xs text-muted-foreground">Sedang berlangsung</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Petugas Tersedia</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableOfficers}</div>
            <p className="text-xs text-muted-foreground">Siap melayani</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle>Antrian Chat</CardTitle>
          <CardDescription>Daftar pengguna yang menunggu petugas</CardDescription>
        </CardHeader>
        <CardContent>
          {queuedSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada yang menunggu di antrian</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queuedSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold">
                      #{session.queue_position}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(session.priority)}>
                          {session.priority}
                        </Badge>
                        {session.topic && (
                          <span className="text-sm text-muted-foreground">
                            {session.topic}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Menunggu: {formatWaitTime(session.wait_time_seconds)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
