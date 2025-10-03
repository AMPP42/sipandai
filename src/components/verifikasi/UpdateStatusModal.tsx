import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle, Clock, FileText, FileCheck, FileClock, FileX, Send, ClipboardCheck } from 'lucide-react';

interface UpdateStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: {
    id: string;
    type: 'usulan_mutasi' | 'application';
    jenis?: string;
    nomor_usulan?: string;
    judul?: string;
    status?: string;
    submitter_id?: string;
    user_id?: string;
  } | null;
  onSuccess: () => void;
}

const timelineStatuses = [
  { 
    value: 'submitted', 
    label: 'Pengajuan Dibuat', 
    icon: FileText,
    description: 'Usulan baru dibuat dan menunggu pengajuan',
    color: 'text-blue-600'
  },
  { 
    value: 'in_review', 
    label: 'Data Diajukan', 
    icon: Send,
    description: 'Data telah diajukan untuk verifikasi',
    color: 'text-green-600'
  },
  { 
    value: 'approved', 
    label: 'Disetujui & Diproses', 
    icon: FileCheck,
    description: 'Usulan telah disetujui dan sedang diproses',
    color: 'text-green-600'
  },
  { 
    value: 'biro_osdma_submitted', 
    label: 'Berkas Diajukan ke Biro OSDMA', 
    icon: Send,
    description: 'Berkas telah diajukan ke Biro OSDMA',
    color: 'text-blue-600'
  },
  { 
    value: 'biro_osdma_review', 
    label: 'Menunggu Keputusan', 
    icon: Clock,
    description: 'Dalam proses review di Biro OSDMA',
    color: 'text-yellow-600'
  },
  { 
    value: 'completed', 
    label: 'SK Telah Terbit', 
    icon: CheckCircle,
    description: 'SK telah diterbitkan dan usulan selesai',
    color: 'text-purple-600'
  },
  { 
    value: 'revision_needed', 
    label: 'Perlu Perbaikan', 
    icon: FileX,
    description: 'Usulan memerlukan perbaikan dari pengusul',
    color: 'text-red-600'
  },
  { 
    value: 'rejected', 
    label: 'Ditolak', 
    icon: FileX,
    description: 'Usulan ditolak',
    color: 'text-red-700'
  }
];

export default function UpdateStatusModal({ 
  open, 
  onOpenChange, 
  application, 
  onSuccess 
}: UpdateStatusModalProps) {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [fileLink, setFileLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!application || !selectedStatus || !user) {
      toast.error('Pilih status terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      if (application.type === 'usulan_mutasi') {
        const { error } = await supabase
          .from('usulan_mutasi')
          .update({
            status: selectedStatus,
            catatan_reviewer: notes || null,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', application.id);

        if (error) throw error;
      } else {
        // Prepare update data with appropriate timestamp fields based on status
        const updateData: any = {
          status: selectedStatus as any
        };

        // Set appropriate timestamp fields based on status
        const now = new Date().toISOString();
        
        if (selectedStatus === 'submitted' || selectedStatus === 'in_review') {
          // When submitting or in review, set tanggal_pengajuan
          updateData.tanggal_pengajuan = now;
        } else if (selectedStatus === 'biro_osdma_submitted') {
          // When submitting to Biro OSDMA, set nota_dinas_uploaded_at
          updateData.nota_dinas_uploaded_at = now;
          updateData.biro_osdma_status = 'submitted';
          updateData.biro_osdma_submitted_at = now;
        } else if (selectedStatus === 'biro_osdma_review') {
          // Keep existing timestamps, just update status
          updateData.biro_osdma_status = 'in_progress';
        } else if (selectedStatus === 'completed') {
          // When completed, set SK uploaded timestamp
          updateData.sk_uploaded_at = now;
          updateData.biro_osdma_status = 'approved';
          updateData.biro_osdma_decision_at = now;
        }

        // Update application status
        const { error } = await supabase
          .from('applications')
          .update(updateData)
          .eq('id', application.id);

        if (error) throw error;

        // Log workflow change
        const { error: workflowError } = await supabase
          .from('workflows')
          .insert({
            application_id: application.id,
            from_status: application.status as any,
            to_status: selectedStatus as any,
            actor_id: user.id,
            note: notes || null,
            file_link: fileLink || null
          });

        if (workflowError) console.error('Workflow error:', workflowError);
      }

      toast.success('Status usulan berhasil diperbarui');
      setSelectedStatus('');
      setNotes('');
      setFileLink('');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Gagal memperbarui status usulan');
    } finally {
      setLoading(false);
    }
  };

  const selectedStatusInfo = timelineStatuses.find(s => s.value === selectedStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Status Timeline Usulan</DialogTitle>
          <DialogDescription>
            Perbarui status timeline untuk usulan: {application?.nomor_usulan || application?.judul}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Label className="text-sm font-medium text-gray-600">Status Saat Ini</Label>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {timelineStatuses.find(s => s.value === application?.status)?.label || 'Unknown'}
            </p>
          </div>

          {/* New Status Selection */}
          <div className="space-y-3">
            <Label htmlFor="status">Pilih Status Baru</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Pilih status timeline..." />
              </SelectTrigger>
              <SelectContent>
                {timelineStatuses.map((status) => {
                  const Icon = status.icon;
                  return (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-3 py-1">
                        <Icon className={`w-4 h-4 ${status.color}`} />
                        <div>
                          <div className="font-medium">{status.label}</div>
                          <div className="text-xs text-gray-500">{status.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Show selected status info */}
            {selectedStatusInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                <div className="flex items-start gap-3">
                  <selectedStatusInfo.icon className={`w-5 h-5 mt-0.5 ${selectedStatusInfo.color}`} />
                  <div>
                    <p className="font-medium text-gray-900">{selectedStatusInfo.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedStatusInfo.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* File Link */}
          <div className="space-y-3">
            <Label htmlFor="fileLink">Link Dokumen Pendukung (Opsional)</Label>
            <Input
              id="fileLink"
              type="url"
              value={fileLink}
              onChange={(e) => setFileLink(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
            <p className="text-xs text-muted-foreground">
              Lampirkan link Google Drive atau dokumen pendukung lainnya
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan atau keterangan mengenai perubahan status..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedStatus('');
                setNotes('');
                setFileLink('');
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedStatus || loading}
            >
              {loading ? 'Memperbarui...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
