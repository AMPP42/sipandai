import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { UserCheck, UserX, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface RegistrationRequest {
  id: string;
  email: string;
  name: string;
  work_unit_id: string;
  status: string;
  created_at: string;
}

export default function UserRegistrationRequests() {
  const { user, isAdminUnit, isAdminPusat } = useAuth();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('profiles')
        .select('id, email, name, work_unit_id, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Admin Unit only sees requests from their unit
      if (isAdminUnit && !isAdminPusat) {
        query = query.eq('work_unit_id', user.work_unit_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error('Gagal memuat permintaan registrasi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      if (actionType === 'approve') {
        const { error } = await supabase.rpc('approve_user_account', {
          target_user_id: selectedRequest.id,
          approver_id: user?.id
        });

        if (error) throw error;
        toast.success('User berhasil disetujui');
      } else {
        const { error } = await supabase.rpc('reject_user_account', {
          target_user_id: selectedRequest.id,
          reason: notes || 'Tidak memenuhi persyaratan'
        });

        if (error) throw error;
        toast.success('User berhasil ditolak');
      }

      setSelectedRequest(null);
      setActionType(null);
      setNotes('');
      loadRequests();
    } catch (error: any) {
      toast.error('Gagal memproses permintaan: ' + error.message);
    }
  };

  if (!isAdminUnit && !isAdminPusat) {
    return (
      <Alert>
        <AlertDescription>
          Anda tidak memiliki akses untuk melihat halaman ini.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Permintaan Registrasi User
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada permintaan registrasi yang pending
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{request.name}</h3>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mendaftar: {new Date(request.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:bg-green-50"
                      onClick={() => {
                        setSelectedRequest(request);
                        setActionType('approve');
                      }}
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setSelectedRequest(request);
                        setActionType('reject');
                      }}
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => {
          setSelectedRequest(null);
          setActionType(null);
          setNotes('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Setujui' : 'Tolak'} Permintaan Registrasi
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? `Apakah Anda yakin ingin menyetujui registrasi ${selectedRequest?.name}?`
                : `Apakah Anda yakin ingin menolak registrasi ${selectedRequest?.name}?`}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Alasan Penolakan</label>
              <Textarea
                placeholder="Masukkan alasan penolakan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
                setNotes('');
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleAction}
              className={actionType === 'approve' ? 'btn-primary' : 'bg-red-600 hover:bg-red-700'}
            >
              {actionType === 'approve' ? 'Setujui' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
