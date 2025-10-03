import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, User, Calendar, CheckCircle, Clock, XCircle, Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { AdminChatView } from '@/components/chat/AdminChatView';

interface ConsultationTicket {
  id: string;
  nomor_ticket: string;
  user_name: string;
  user_unit: string;
  judul: string;
  deskripsi: string;
  kategori: string;
  prioritas: string;
  status: string;
  konselor_id: string | null;
  konselor_name: string | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminConsultations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<ConsultationTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<ConsultationTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<ConsultationTicket | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [chatTicket, setChatTicket] = useState<ConsultationTicket | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kategoriFilter, setKategoriFilter] = useState<string>('all');
  const [prioritasFilter, setPrioritasFilter] = useState<string>('all');

  // Officers list for assignment
  const [officers, setOfficers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');

  useEffect(() => {
    loadTickets();
    loadOfficers();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('consultation-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultation_tickets',
        },
        () => {
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, kategoriFilter, prioritasFilter]);

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat tiket konsultasi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOfficers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'admin_pusat');

      if (error) throw error;
      setOfficers(data || []);
    } catch (error) {
      console.error('Error loading officers:', error);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.nomor_ticket.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.judul.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Kategori filter
    if (kategoriFilter !== 'all') {
      filtered = filtered.filter((t) => t.kategori === kategoriFilter);
    }

    // Prioritas filter
    if (prioritasFilter !== 'all') {
      filtered = filtered.filter((t) => t.prioritas === prioritasFilter);
    }

    setFilteredTickets(filtered);
  };

  const handleOpenChatSession = async (ticket: ConsultationTicket) => {
    try {
      const { error } = await supabase
        .from('consultation_tickets')
        .update({
          konselor_id: user?.id,
          konselor_name: user?.name || 'Admin',
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticket.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Sesi live chat telah dibuka',
      });

      // Langsung buka chat view
      setChatTicket(ticket);
      loadTickets();
    } catch (error) {
      console.error('Error opening chat session:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuka sesi live chat',
        variant: 'destructive',
      });
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('consultation_tickets')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Tiket ditutup',
      });

      loadTickets();
    } catch (error) {
      console.error('Error closing ticket:', error);
      toast({
        title: 'Error',
        description: 'Gagal menutup tiket',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      open: { variant: 'default', label: 'Menunggu Konfirmasi' },
      in_progress: { variant: 'secondary', label: 'Sesi Terbuka' },
      resolved: { variant: 'default', label: 'Selesai' },
      closed: { variant: 'outline', label: 'Ditutup' },
    };
    const config = variants[status] || variants.open;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (prioritas: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
    };
    return (
      <Badge className={colors[prioritas] || colors.medium}>
        {prioritas === 'low' ? 'Rendah' : prioritas === 'medium' ? 'Sedang' : 'Tinggi'}
      </Badge>
    );
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat tiket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tiket</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terbuka</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diproses</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Tiket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Cari</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nomor, nama, judul..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="open">Terbuka</SelectItem>
                  <SelectItem value="in_progress">Diproses</SelectItem>
                  <SelectItem value="resolved">Selesai</SelectItem>
                  <SelectItem value="closed">Ditutup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori</Label>
              <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
                <SelectTrigger id="kategori">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="Mutasi">Mutasi</SelectItem>
                  <SelectItem value="Kenaikan Pangkat">Kenaikan Pangkat</SelectItem>
                  <SelectItem value="Pensiun">Pensiun</SelectItem>
                  <SelectItem value="Umum">Umum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioritas">Prioritas</Label>
              <Select value={prioritasFilter} onValueChange={setPrioritasFilter}>
                <SelectTrigger id="prioritas">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Prioritas</SelectItem>
                  <SelectItem value="low">Rendah</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="high">Tinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Tiket Konsultasi</CardTitle>
          <CardDescription>
            Kelola tiket konsultasi dari pengguna
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Tiket</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Konselor</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Tidak ada tiket yang ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.nomor_ticket}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.user_name}</p>
                        <p className="text-sm text-muted-foreground">{ticket.user_unit}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{ticket.judul}</p>
                        <p className="text-sm text-muted-foreground truncate">{ticket.deskripsi}</p>
                      </div>
                    </TableCell>
                    <TableCell>{ticket.kategori}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.prioritas)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
                      {ticket.konselor_name || (
                        <span className="text-muted-foreground">Belum ditugaskan</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(ticket.created_at), {
                        addSuffix: true,
                        locale: id,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {ticket.status === 'open' && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenChatSession(ticket)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Buka Sesi Live Chat
                          </Button>
                        )}
                        {(ticket.status === 'in_progress' || ticket.status === 'resolved') && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setChatTicket(ticket)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Lihat Chat
                          </Button>
                        )}
                        {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCloseTicket(ticket.id)}
                          >
                            Tutup
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Chat View Dialog */}
      <Dialog open={!!chatTicket} onOpenChange={(open) => !open && setChatTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0" aria-describedby="chat-description">
          <DialogTitle className="sr-only">Percakapan Live Chat</DialogTitle>
          <DialogDescription id="chat-description" className="sr-only">
            Lihat dan balas percakapan chat dengan user
          </DialogDescription>
          {chatTicket && (
            <AdminChatView
              ticketId={chatTicket.id}
              ticketNumber={chatTicket.nomor_ticket}
              ticketTitle={chatTicket.judul}
              userName={chatTicket.user_name}
              onClose={() => setChatTicket(null)}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
