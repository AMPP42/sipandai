import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, FileText, AlertCircle, Eye } from 'lucide-react';

interface DocumentVerification {
  id: string;
  application_id: string;
  document_type: string;
  document_name: string;
  status: 'pending' | 'approved' | 'needs_fix';
  admin_notes?: string;
  verified_by?: string;
  verified_at?: string;
}

interface Props {
  applicationId: string;
  applicationStatus: string;
  compact?: boolean; // New prop for compact display in tables
}

export default function DocumentVerificationStatus({ applicationId, applicationStatus, compact }: Props) {
  const [documentVerifications, setDocumentVerifications] = useState<DocumentVerification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (applicationId && ['revision_needed', 'approved', 'in_review'].includes(applicationStatus)) {
      loadDocumentVerifications();
    }
  }, [applicationId, applicationStatus]);

  const loadDocumentVerifications = async () => {
    setLoading(true);
    try {
      console.log('Loading document verifications for application:', applicationId);
      const { data, error } = await supabase
        .from('document_verifications')
        .select('*')
        .eq('application_id', applicationId)
        .order('document_type');

      if (error) {
        console.error('Error loading document verifications:', error);
        // Don't throw error to prevent stack depth issues, just set empty array
        setDocumentVerifications([]);
        return;
      }
      console.log('Loaded document verifications:', data?.length || 0);
      setDocumentVerifications((data || []) as DocumentVerification[]);
    } catch (error) {
      console.error('Error loading document verifications:', error);
      setDocumentVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'needs_fix':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Disetujui</Badge>;
      case 'needs_fix':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Perlu Perbaikan</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Menunggu</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getVerificationSummary = () => {
    if (documentVerifications.length === 0) return null;

    const approved = documentVerifications.filter(doc => doc.status === 'approved').length;
    const needsFix = documentVerifications.filter(doc => doc.status === 'needs_fix').length;
    const pending = documentVerifications.filter(doc => doc.status === 'pending').length;
    const total = documentVerifications.length;

    return { approved, needsFix, pending, total };
  };

  // Don't show anything if there are no document verifications to display
  if (!['revision_needed', 'approved', 'in_review'].includes(applicationStatus)) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        Memuat status verifikasi...
      </div>
    );
  }

  if (documentVerifications.length === 0) {
    return null;
  }

  const summary = getVerificationSummary();
  if (!summary) return null;

  // Compact view for tables
  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="text-xs font-medium">{summary.approved}</span>
          </div>
          {summary.needsFix > 0 && (
            <div className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-600" />
              <span className="text-xs font-medium text-red-600">{summary.needsFix}</span>
            </div>
          )}
          {summary.pending > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-yellow-600" />
              <span className="text-xs font-medium">{summary.pending}</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setShowDetailsModal(true)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Detail
          </Button>
        </div>

        {/* Details Modal - shared between compact and full view */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Detail Verifikasi Dokumen
              </DialogTitle>
              <DialogDescription>
                Status verifikasi untuk setiap persyaratan dokumen
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {documentVerifications.map((verification) => (
                <Card key={verification.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(verification.status)}
                          <h4 className="font-medium">{verification.document_name}</h4>
                          {getStatusBadge(verification.status)}
                        </div>
                        
                        {verification.admin_notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded border-l-4 border-l-blue-200">
                            <p className="text-sm text-muted-foreground mb-1">Catatan Verifikator:</p>
                            <p className="text-sm">{verification.admin_notes}</p>
                          </div>
                        )}

                        {verification.verified_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Diverifikasi pada {new Date(verification.verified_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Tutup
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Full view for detail pages
  return (
    <>
      <Card className="border-l-4 border-l-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base">Status Verifikasi Dokumen</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetailsModal(true)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Lihat Detail
            </Button>
          </div>
          <CardDescription>
            Hasil verifikasi persyaratan dokumen oleh Admin Pusat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xl font-bold text-green-600">{summary.approved}</span>
              </div>
              <p className="text-xs text-muted-foreground">Disetujui</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-xl font-bold text-red-600">{summary.needsFix}</span>
              </div>
              <p className="text-xs text-muted-foreground">Perlu Perbaikan</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-xl font-bold text-yellow-600">{summary.pending}</span>
              </div>
              <p className="text-xs text-muted-foreground">Menunggu</p>
            </div>
          </div>

          {/* Document List with Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Rincian Status Dokumen:</h4>
            {documentVerifications.map((verification) => (
              <div key={verification.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <div className="flex items-center gap-2 flex-1">
                  {getStatusIcon(verification.status)}
                  <span className="text-sm font-medium">{verification.document_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(verification.status)}
                </div>
              </div>
            ))}
          </div>

          {/* Status Messages */}
          {summary.needsFix > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Ada {summary.needsFix} dokumen yang perlu diperbaiki
                </span>
              </div>
              <p className="text-xs text-red-700">
                Silakan perbaiki dokumen sesuai catatan verifikator, kemudian submit ulang pengajuan Anda.
              </p>
            </div>
          )}

          {summary.approved === summary.total && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Semua dokumen telah diverifikasi dan disetujui
                </span>
              </div>
              <p className="text-xs text-green-700">
                Pengajuan Anda sedang diproses untuk tahap selanjutnya.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Detail Verifikasi Dokumen
            </DialogTitle>
            <DialogDescription>
              Status verifikasi untuk setiap persyaratan dokumen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {documentVerifications.map((verification) => (
              <Card key={verification.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(verification.status)}
                        <h4 className="font-medium">{verification.document_name}</h4>
                        {getStatusBadge(verification.status)}
                      </div>
                      
                      {verification.admin_notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded border-l-4 border-l-blue-200">
                          <p className="text-sm text-muted-foreground mb-1">Catatan Verifikator:</p>
                          <p className="text-sm">{verification.admin_notes}</p>
                        </div>
                      )}

                      {verification.verified_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Diverifikasi pada {new Date(verification.verified_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}