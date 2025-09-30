import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';
type Application = Database['public']['Tables']['applications']['Row'];
type DocumentVerification = Database['public']['Tables']['document_verifications']['Row'];
interface DocumentRevisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  onRevisionSubmitted: () => void;
}
export default function DocumentRevisionModal({
  open,
  onOpenChange,
  application,
  onRevisionSubmitted
}: DocumentRevisionModalProps) {
  const [documentVerifications, setDocumentVerifications] = useState<DocumentVerification[]>([]);
  const [revisedDocuments, setRevisedDocuments] = useState<{
    [key: string]: string;
  }>({});
  const [revisionNotes, setRevisionNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  useEffect(() => {
    if (open && application.id) {
      loadDocumentVerifications();
    }
  }, [open, application.id]);
  const loadDocumentVerifications = async () => {
    try {
      setLoadingVerifications(true);
      const {
        data,
        error
      } = await supabase.from('document_verifications').select('*').eq('application_id', application.id).order('document_name');
      if (error) throw error;
      setDocumentVerifications(data || []);
    } catch (error) {
      console.error('Error loading document verifications:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data verifikasi dokumen",
        variant: "destructive"
      });
    } finally {
      setLoadingVerifications(false);
    }
  };
  const handleSubmitRevision = async () => {
    const documentsNeedingRevision = documentVerifications.filter(doc => doc.status === 'rejected');
    const missingRevisions = documentsNeedingRevision.filter(doc => !revisedDocuments[doc.id]);
    if (missingRevisions.length > 0) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua dokumen yang perlu diperbaiki",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);

      // Update document verifications with new links and reset status to pending
      for (const docId of Object.keys(revisedDocuments)) {
        if (revisedDocuments[docId]) {
          const {
            error
          } = await supabase.from('document_verifications').update({
            document_link: revisedDocuments[docId],
            status: 'pending',
            admin_notes: null,
            verified_at: null,
            verified_by: null
          }).eq('id', docId);
          if (error) throw error;
        }
      }

      // Update application status back to in_review
      const {
        error: appError
      } = await supabase.from('applications').update({
        status: 'in_review',
        keterangan: revisionNotes || null
      }).eq('id', application.id);
      if (appError) throw appError;
      toast({
        title: "Berhasil",
        description: "Dokumen perbaikan berhasil disubmit untuk verifikasi ulang"
      });
      onRevisionSubmitted();
      onOpenChange(false);

      // Reset form
      setRevisedDocuments({});
      setRevisionNotes("");
    } catch (error: any) {
      console.error('Error submitting revision:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengsubmit perbaikan dokumen",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const documentsNeedingRevision = documentVerifications.filter(doc => doc.status === 'rejected' || doc.status === 'needs_fix');
  const approvedDocuments = documentVerifications.filter(doc => doc.status === 'approved');
  const pendingDocuments = documentVerifications.filter(doc => doc.status === 'pending');
  const processedDocuments = documentVerifications.filter(doc => doc.status === 'processed');
  const repairedDocuments = documentVerifications.filter(doc => doc.status === 'revised');

  // Show different content based on application status
  const showRevisionInterface = application.status === 'revision_needed' && documentsNeedingRevision.length > 0;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showRevisionInterface ? <>
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Perbaikan Dokumen Diperlukan
              </> : <>
                <FileText className="w-5 h-5 text-blue-500" />
                Detail Verifikasi Dokumen
              </>}
          </DialogTitle>
        </DialogHeader>

        {loadingVerifications ? <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Memuat data verifikasi...</p>
          </div> : <div className="space-y-6">
            {/* Summary */}
            

            {/* Documents needing revision */}
            {documentsNeedingRevision.length > 0 && <div className="space-y-4">
                <h4 className="font-semibold text-yellow-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Dokumen yang Perlu Diperbaiki ({documentsNeedingRevision.length})
                </h4>
                
                {documentsNeedingRevision.map((doc, index) => <div key={doc.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-yellow-800">
                            {index + 1}. {doc.document_name}
                          </h5>
                          <Badge className="bg-yellow-100 text-yellow-700 mt-1">
                            Perlu Perbaikan
                          </Badge>
                          {doc.document_link && <p className="text-xs text-gray-600 mt-1">
                              Link saat ini: <a href={doc.document_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat dokumen</a>
                            </p>}
                        </div>
                      </div>
                      
                      {doc.admin_notes && <div className="bg-white border border-yellow-200 rounded p-3">
                          <p className="text-sm text-yellow-700">
                            <strong>Catatan Verifikator:</strong> {doc.admin_notes}
                          </p>
                        </div>}

                      {showRevisionInterface && <div className="space-y-2">
                          <Label htmlFor={`revision-${doc.id}`}>
                            Link Dokumen Perbaikan <span className="text-red-500">*</span>
                          </Label>
                          <Input id={`revision-${doc.id}`} placeholder="Masukkan link Google Drive dokumen yang sudah diperbaiki..." value={revisedDocuments[doc.id] || ''} onChange={e => setRevisedDocuments(prev => ({
                  ...prev,
                  [doc.id]: e.target.value
                }))} className="border-yellow-300 focus:border-yellow-500" />
                        </div>}
                    </div>
                  </div>)}
              </div>}

            {/* Pending documents */}
            {pendingDocuments.length > 0 && <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">
                    Dokumen Menunggu Verifikasi ({pendingDocuments.length})
                  </h4>
                  <div className="grid gap-2">
                    {pendingDocuments.map((doc, index) => <div key={doc.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 border border-gray-200 rounded">
                        <div>
                            <span className="text-sm font-medium text-gray-800">
                              {index + 1}. {doc.document_name}
                            </span>
                          {doc.document_link && <p className="text-xs text-gray-600">
                              <a href={doc.document_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat dokumen</a>
                            </p>}
                        </div>
                        <Badge className="bg-gray-100 text-gray-700">
                          Menunggu Verifikasi
                        </Badge>
                      </div>)}
                  </div>
                </div>
              </>}

            {/* Repaired documents */}
            {repairedDocuments.length > 0 && <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-700">
                    Dokumen Sudah Diperbaiki ({repairedDocuments.length})
                  </h4>
                  <div className="grid gap-2">
                     {repairedDocuments.map((doc, index) => <div key={doc.id} className="flex items-center justify-between py-2 px-3 bg-orange-50 border border-orange-200 rounded">
                         <div>
                            <span className="text-sm font-medium text-orange-800">
                              {index + 1}. {doc.document_name}
                            </span>
                           {doc.document_link && <p className="text-xs text-gray-600">
                               <a href={doc.document_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat dokumen</a>
                             </p>}
                         </div>
                          <Badge className="bg-orange-100 text-orange-700">
                            Sudah Diperbaiki
                          </Badge>
                       </div>)}
                  </div>
                </div>
              </>}

            {/* Processed documents */}
            {processedDocuments.length > 0 && <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-700">
                    Dokumen Diproses ({processedDocuments.length})
                  </h4>
                  <div className="grid gap-2">
                     {processedDocuments.map((doc, index) => <div key={doc.id} className="flex items-center justify-between py-2 px-3 bg-green-50 border border-green-200 rounded">
                         <div>
                            <span className="text-sm font-medium text-green-800">
                              {index + 1}. {doc.document_name}
                            </span>
                           {doc.document_link && <p className="text-xs text-gray-600">
                               <a href={doc.document_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat dokumen</a>
                             </p>}
                         </div>
                          <Badge className="bg-green-100 text-green-700">
                            Diproses
                          </Badge>
                       </div>)}
                  </div>
                </div>
              </>}

            {/* Approved documents */}
            {approvedDocuments.length > 0 && <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-700">
                    Dokumen yang Disetujui ({approvedDocuments.length})
                  </h4>
                  <div className="grid gap-2">
                     {approvedDocuments.map((doc, index) => <div key={doc.id} className="flex items-center justify-between py-2 px-3 bg-blue-50 border border-blue-200 rounded">
                         <div>
                            <span className="text-sm font-medium text-blue-800">
                              {index + 1}. {doc.document_name}
                            </span>
                           {doc.document_link && <p className="text-xs text-gray-600">
                               <a href={doc.document_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat dokumen</a>
                             </p>}
                         </div>
                          <Badge className="bg-blue-100 text-blue-700">
                            Disetujui
                          </Badge>
                       </div>)}
                  </div>
                </div>
              </>}

            {/* Additional notes and action buttons - only show for revision interface */}
            {showRevisionInterface && <>
                <div className="space-y-2">
                  <Label htmlFor="revision-notes">Catatan Tambahan (Opsional)</Label>
                  <Textarea id="revision-notes" placeholder="Masukkan catatan atau keterangan tambahan untuk perbaikan dokumen..." value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)} className="min-h-[80px]" />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleSubmitRevision} disabled={loading || documentsNeedingRevision.length === 0} className="bg-red-600 hover:bg-red-700 text-white">
                    {loading ? <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Mengirim...
                      </> : <>
                        <FileText className="w-4 h-4 mr-2" />
                        Submit Perbaikan
                      </>}
                  </Button>
                </div>
              </>}

            {/* Close button for view-only mode */}
            {!showRevisionInterface && <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Tutup
                </Button>
              </div>}
          </div>}
      </DialogContent>
    </Dialog>;
}