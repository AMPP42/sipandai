import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Mail, MessageSquare, Phone, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReminderSent {
  id: string;
  employee_id: string;
  reminder_type: 'email' | 'sms' | 'whatsapp';
  template_id: string | null;
  sent_at: string;
  status: 'sent' | 'failed' | 'pending';
  error_message: string | null;
  metadata: any;
  employees?: {
    nama: string;
    nip: string | null;
    email: string | null;
    handphone: string | null;
  };
  retirement_reminder_templates?: {
    template_name: string;
  };
}

export default function RiwayatReminderPensiun() {
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<ReminderSent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('retirement_reminders_sent')
        .select(`
          *,
          employees:employee_id (
            nama,
            nip,
            email,
            handphone
          ),
          retirement_reminder_templates:template_id (
            template_name
          )
        `)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setReminders((data || []) as ReminderSent[]);
    } catch (error: any) {
      console.error('Error loading reminders:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat riwayat reminder',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      sent: 'default',
      failed: 'destructive',
      pending: 'secondary',
    };

    const labels: Record<string, string> = {
      sent: 'Terkirim',
      failed: 'Gagal',
      pending: 'Pending',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <Phone className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      reminder.employees?.nama.toLowerCase().includes(search) ||
      reminder.employees?.nip?.toLowerCase().includes(search) ||
      reminder.reminder_type.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(filteredReminders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReminders = filteredReminders.slice(startIndex, startIndex + itemsPerPage);

  const failedCount = reminders.filter(r => r.status === 'failed').length;
  const sentCount = reminders.filter(r => r.status === 'sent').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Riwayat Pengiriman Reminder</CardTitle>
            <CardDescription>
              Semua reminder pensiun yang telah dikirim melalui Email, SMS, dan WhatsApp
            </CardDescription>
          </div>
          <Button onClick={loadReminders} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{sentCount}</div>
            <div className="text-sm text-muted-foreground">Berhasil Terkirim</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <div className="text-sm text-muted-foreground">Gagal Terkirim</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">{reminders.length}</div>
            <div className="text-sm text-muted-foreground">Total Reminder</div>
          </div>
        </div>

        {/* Alert for failed reminders */}
        {failedCount > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Terdapat {failedCount} reminder yang gagal terkirim. Periksa konfigurasi Resend domain dan kredensial Twilio.
            </AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="flex items-center gap-4">
          <Input
            placeholder="Cari pegawai atau channel..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Memuat riwayat reminder...</p>
          </div>
        ) : paginatedReminders.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Tidak ada hasil yang ditemukan' : 'Belum ada reminder yang dikirim'}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pegawai</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Waktu Kirim</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reminder.employees?.nama || '-'}</p>
                        <p className="text-sm text-muted-foreground">
                          NIP: {reminder.employees?.nip || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getChannelIcon(reminder.reminder_type)}
                        <span className="capitalize">{reminder.reminder_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {reminder.retirement_reminder_templates?.template_name || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(reminder.sent_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(reminder.status)}
                        {getStatusBadge(reminder.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reminder.status === 'failed' && reminder.error_message && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p className="text-sm">{reminder.error_message}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {reminder.status === 'sent' && (
                        <div className="flex items-center gap-2">
                          {reminder.reminder_type === 'email' && reminder.employees?.email && (
                            <span className="text-xs text-muted-foreground">
                              {reminder.employees.email}
                            </span>
                          )}
                          {(reminder.reminder_type === 'sms' || reminder.reminder_type === 'whatsapp') && 
                           reminder.employees?.handphone && (
                            <span className="text-xs text-muted-foreground">
                              {reminder.employees.handphone}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
