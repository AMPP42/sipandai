import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type Application = Database['public']['Tables']['applications']['Row'];

interface RevisionSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  onRevisionSubmitted: () => void;
}

export default function RevisionSubmissionModal({
  open,
  onOpenChange,
  application,
  onRevisionSubmitted
}: RevisionSubmissionModalProps) {
  const [revisionNotes, setRevisionNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmitRevision = async () => {
    try {
      setLoading(true);

      // Update application status to submitted for re-verification
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'submitted',
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);

      if (error) throw error;

      // If there are revision notes, update the application with them
      if (revisionNotes) {
        const { error: updateError } = await supabase
          .from('applications')
          .update({
            keterangan: `Perbaikan - Diajukan Ulang: ${revisionNotes}`,
          })
          .eq('id', application.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Berhasil",
        description: "Perbaikan usulan berhasil disubmit untuk verifikasi ulang"
      });

      onRevisionSubmitted();
      onOpenChange(false);
      setRevisionNotes("");

    } catch (error: any) {
      console.error('Error submitting revision:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengsubmit perbaikan usulan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Submit Perbaikan Usulan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              Usulan akan diajukan kembali ke admin pusat untuk verifikasi ulang setelah perbaikan.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revision-notes">Catatan Perbaikan (Opsional)</Label>
            <Textarea
              id="revision-notes"
              placeholder="Masukkan catatan atau penjelasan tentang perbaikan yang telah dilakukan..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmitRevision}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-b-transparent" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Perbaikan
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}