import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FileText, AlertCircle, CheckCircle, Edit } from "lucide-react";

interface DocumentVerification {
  id: string;
  document_type: string;
  document_name: string;
  status: string;
  document_link: string | null;
  admin_notes: string | null;
  verified_at: string | null;
  verified_by: string | null;
}

interface DocumentRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicationNumber: string;
}

export const DocumentRevisionModal = ({ isOpen, onClose, applicationId, applicationNumber }: DocumentRevisionModalProps) => {
  const [documentVerifications, setDocumentVerifications] = useState<DocumentVerification[]>([]);
  const [revisionLinks, setRevisionLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && applicationId) {
      loadDocumentVerifications();
    }
  }, [isOpen, applicationId]);

  const loadDocumentVerifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_verifications')
        .select('*')
        .eq('application_id', applicationId)
        .order('document_type');

      if (error) throw error;
      setDocumentVerifications(data || []);

      // Initialize revision links for documents that need fixes
      const needsFixDocs = (data || []).filter(doc => doc.status === 'needs_fix');
      const initialLinks: Record<string, string> = {};
      needsFixDocs.forEach(doc => {
        initialLinks[doc.id] = doc.document_link || '';
      });
      setRevisionLinks(initialLinks);

    } catch (error) {
      console.error('Error loading document verifications:', error);
      toast.error("Gagal memuat data verifikasi dokumen");
    } finally {
      setLoading(false);
    }
  };

  const handleRevisionLinkChange = (docId: string, link: string) => {
    setRevisionLinks(prev => ({
      ...prev,
      [docId]: link
    }));
  };

  const handleSubmitRevisions = async () => {
    const documentsNeedingFix = documentVerifications.filter(doc => doc.status === 'needs_fix');
    const hasEmptyLinks = documentsNeedingFix.some(doc => !revisionLinks[doc.id]?.trim());

    if (hasEmptyLinks) {
      toast.error("Harap lengkapi semua link dokumen yang perlu diperbaiki");
      return;
    }

    setSubmitting(true);
    try {
      // Update document links and reset status to pending for re-verification
      const updates = documentsNeedingFix.map(doc => 
        supabase
          .from('document_verifications')
          .update({
            document_link: revisionLinks[doc.id],
            status: 'pending',
            admin_notes: null,
            verified_at: null,
            verified_by: null
          })
          .eq('id', doc.id)
      );

      const results = await Promise.all(updates);
      const hasError = results.some(result => result.error);

      if (hasError) {
        throw new Error("Gagal memperbarui beberapa dokumen");
      }

      // Update application status back to "in_review" for re-verification
      await supabase
        .from('applications')
        .update({ 
          status: 'in_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      toast.success("Dokumen perbaikan berhasil dikirim untuk verifikasi ulang");
      onClose();
    } catch (error) {
      console.error('Error submitting revisions:', error);
      toast.error("Gagal mengirim dokumen perbaikan");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Disetujui</Badge>;
      case 'needs_fix':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="w-3 h-3 mr-1" />Perlu Perbaikan</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><FileText className="w-3 h-3 mr-1" />Menunggu Verifikasi</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const documentsNeedingFix = documentVerifications.filter(doc => doc.status === 'needs_fix');
  const hasDocumentsNeedingFix = documentsNeedingFix.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Detail Verifikasi Dokumen - {applicationNumber}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Memuat data verifikasi...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Verifikasi Dokumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {documentVerifications.filter(d => d.status === 'approved').length}
                    </div>
                    <div className="text-sm text-green-700">Disetujui</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {documentVerifications.filter(d => d.status === 'needs_fix').length}
                    </div>
                    <div className="text-sm text-red-700">Perlu Perbaikan</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {documentVerifications.filter(d => d.status === 'pending').length}
                    </div>
                    <div className="text-sm text-yellow-700">Menunggu Verifikasi</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Daftar Dokumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentVerifications.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{doc.document_name}</h4>
                          <p className="text-sm text-muted-foreground">Tipe: {doc.document_type}</p>
                        </div>
                        {getStatusBadge(doc.status)}
                      </div>

                      {doc.document_link && (
                        <div className="mb-3">
                          <Label className="text-sm font-medium">Link Dokumen Saat Ini:</Label>
                          <div className="mt-1">
                            <a 
                              href={doc.document_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                            >
                              {doc.document_link}
                            </a>
                          </div>
                        </div>
                      )}

                      {doc.admin_notes && (
                        <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                          <Label className="text-sm font-medium text-yellow-800">Catatan Verifikator:</Label>
                          <p className="text-sm text-yellow-700 mt-1">{doc.admin_notes}</p>
                        </div>
                      )}

                      {doc.status === 'needs_fix' && (
                        <div className="mt-3 space-y-2">
                          <Label htmlFor={`revision-${doc.id}`} className="text-sm font-medium flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Link Dokumen Perbaikan *
                          </Label>
                          <Input
                            id={`revision-${doc.id}`}
                            value={revisionLinks[doc.id] || ''}
                            onChange={(e) => handleRevisionLinkChange(doc.id, e.target.value)}
                            placeholder="Masukkan link dokumen yang sudah diperbaiki..."
                            className="w-full"
                          />
                        </div>
                      )}

                      {doc.verified_at && (
                        <div className="mt-3 text-xs text-muted-foreground">
                          Diverifikasi pada: {new Date(doc.verified_at).toLocaleString('id-ID')}
                          {doc.verified_by && ` oleh ${doc.verified_by}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Tutup
              </Button>
              {hasDocumentsNeedingFix && (
                <Button onClick={handleSubmitRevisions} disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Kirim Perbaikan
                    </>
                  )}
                </Button>
              )}
            </div>

            {!hasDocumentsNeedingFix && documentVerifications.length > 0 && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Semua dokumen telah diverifikasi dengan baik</span>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};