import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import DocumentVerificationStatus from '@/components/applications/DocumentVerificationStatus';
import { 
  ArrowLeft, 
  User, 
  Building, 
  Calendar,
  FileText,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type Application = Database['public']['Tables']['applications']['Row'];

interface ApplicationDetail extends Application {
  employee_data?: {
    employee_id: string;
    employee_name: string;
    employee_nip: string;
    unit_asal: string;
    position_id: string;
    unit_tujuan: string;
    jabatan_tujuan: string;
    alasan_mutasi: string;
    nomor_usulan: string;
  };
}

interface DocumentVerificationStatus {
  [key: string]: {
    status: 'approved' | 'needs_fix' | 'pending';
    admin_notes?: string;
    document_name: string;
  };
}

const DOCUMENT_REQUIREMENTS = [
  'Surat Pernyataan Lolos Butuh dari PPK Instansi Asal (Asli)',
  'Surat Keterangan Tidak Sedang Menjalani Hukuman Disiplin (Asli)',
  'Surat Keterangan Tidak Sedang Menjalani Tugas Belajar/Ikatan Dinas (Asli)',
  'Surat Keterangan Tidak Mempunyai Hutang Piutang dengan Pihak Bank (Asli)',
  'Surat Pernyataan Bebas Temuan yang Diterbitkan oleh ITJEN (Asli)',
  'ANJAB dan ABK yang ditandatangani oleh PPK Instansi Asal (Bila Pindah Antar Kementerian)',
  'SK CPNS (Fotokopi legalisir)',
  'SK PNS (Fotokopi legalisir)',
  'SK Pangkat Terakhir (Fotokopi legalisir)',
  'SK Jabatan Terakhir (Fotokopi legalisir)',
  'KARPEG (Fotokopi legalisir)',
  'Ijazah dan Transkrip Nilai Universitas (Fotokopi legalisir)',
  'SKP 2 tahun terakhir (Fotokopi legalisir)',
  'Surat permohonan mutasi dari ybs',
  'Daftar Riwayat Hidup (DRH) sesuai Keputusan Kepala BKN Nomor 11 Tahun 2002',
  'Nota Dinas Usulan Mutasi yang telah ditandatangani'
];

export default function DetailMutasiTerpadu() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [documents, setDocuments] = useState<{ [key: string]: string }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [documentVerificationStatus, setDocumentVerificationStatus] = useState<DocumentVerificationStatus>({});
  const [fixedDocuments, setFixedDocuments] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    if (id) {
      loadApplication();
    }
  }, [id]);

  useEffect(() => {
    if (application) {
      // Check if we're in edit mode or if status is revision_needed
      const urlParams = new URLSearchParams(location.search);
      const editMode = urlParams.get('edit');
      if (editMode || application.status === 'revision_needed') {
        setIsEditing(true);
        loadApplicationForEdit();
      }
    }
  }, [application, location.search]);

  const loadApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const appData = {
          ...data,
          employee_data: data.estimasi ? JSON.parse(data.estimasi) : null
        };
        setApplication(appData);
      }
    } catch (error) {
      console.error('Error loading application:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengajuan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadApplicationForEdit = async () => {
    try {
      // Load documents
      const { data: documentsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('application_id', id)
        .order('document_index');

      if (docsError) throw docsError;

      // Load document verification status
      const { data: verificationData, error: verificationError } = await supabase
        .from('document_verifications')
        .select('*')
        .eq('application_id', id);

      if (verificationError) throw verificationError;

      // Populate documents - preserve existing document links
      const loadedDocuments: { [key: string]: string } = {};
      documentsData?.forEach(doc => {
        if (doc.document_index !== null && doc.drive_link) {
          loadedDocuments[`doc_${doc.document_index}`] = doc.drive_link;
        }
      });
      setDocuments(loadedDocuments);

      // Populate document verification status
      const verificationStatus: DocumentVerificationStatus = {};
      verificationData?.forEach(verification => {
        if (verification.document_type) {
          const docIndex = verification.document_type.replace('doc_', '');
          const docKey = `doc_${docIndex}`;
          verificationStatus[docKey] = {
            status: verification.status as 'approved' | 'needs_fix' | 'pending',
            admin_notes: verification.admin_notes || undefined,
            document_name: verification.document_name
          };
        }
      });
      setDocumentVerificationStatus(verificationStatus);

      console.log('Loaded documents for edit:', loadedDocuments);
      console.log('Loaded verification status:', verificationStatus);

      toast({
        title: "Data Dimuat",
        description: "Data usulan berhasil dimuat untuk diedit"
      });

    } catch (error) {
      console.error('Error loading application data for edit:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data usulan untuk edit",
        variant: "destructive"
      });
    }
  };

  const handleDocumentChange = (index: number, value: string) => {
    const docKey = `doc_${index}`;
    setDocuments(prev => ({
      ...prev,
      [docKey]: value
    }));
  };

  const handleMarkDocumentFixed = (docKey: string) => {
    setFixedDocuments(prev => new Set(prev).add(docKey));
    toast({
      title: "Dokumen Diperbaiki",
      description: "Dokumen telah ditandai sebagai diperbaiki"
    });
  };

  const handleSaveDraft = async () => {
    if (!application || !application.employee_data) return;

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User tidak terautentikasi",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Update application keterangan and ensure status stays as draft
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'draft', // Explicitly ensure status remains draft
          keterangan: `Kategori: Mutasi Terpadu${additionalNotes ? ` - ${additionalNotes}` : ''}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Delete existing documents first
      const { error: deleteDocsError } = await supabase
        .from('documents')
        .delete()
        .eq('application_id', id);

      if (deleteDocsError) throw deleteDocsError;

      // Insert ALL documents from the form state, including empty ones as placeholders
      const documentInserts = DOCUMENT_REQUIREMENTS.map((documentName, index) => {
        const docKey = `doc_${index}`;
        const linkValue = documents[docKey] || '';
        
        return {
          application_id: id,
          title: documentName,
          drive_link: linkValue.trim(),
          created_by: user.id,
          document_category: 'mutasi_terpadu',
          document_index: index
        };
      }).filter(doc => doc.drive_link !== ''); // Only save documents with actual links

      if (documentInserts.length > 0) {
        const { error: documentsError } = await supabase
          .from('documents')
          .insert(documentInserts);

        if (documentsError) throw documentsError;
      }

      toast({
        title: "Berhasil",
        description: `Draft disimpan dengan ${documentInserts.length} dokumen. Status tetap Draft.`,
      });

      console.log('Draft saved successfully:', {
        applicationId: id,
        documentsCount: documentInserts.length,
        status: 'draft'
      });

    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan draft pengajuan",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!application || !application.employee_data) return;

    // Check if all documents are provided for final submission
    const allDocumentsProvided = DOCUMENT_REQUIREMENTS.every((_, index) => {
      const docKey = `doc_${index}`;
      return documents[docKey] && documents[docKey].trim() !== '';
    });

    if (!allDocumentsProvided) {
      toast({
        title: "Error", 
        description: "Semua dokumen persyaratan harus diisi sebelum submit pengajuan",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User tidak terautentikasi",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (isEditing) {
        // Update existing application
        const { error: updateError } = await supabase
          .from('applications')
          .update({
            status: 'submitted',
            keterangan: `Perbaikan - Diajukan Ulang - Kategori: Mutasi Terpadu${additionalNotes ? ` - ${additionalNotes}` : ''}`,
            updated_at: new Date().toISOString(),
            progress: 20,  // Reset progress for resubmission
            detailed_verification_status: 'not_started' // Reset verification status
          })
          .eq('id', id);

        if (updateError) throw updateError;

        // Reset document verifications for admin to re-verify
        const { error: deleteVerificationError } = await supabase
          .from('document_verifications')
          .delete()
          .eq('application_id', id);

        if (deleteVerificationError) {
          console.error('Error deleting old verifications:', deleteVerificationError);
          // Don't throw error, just log it since this is cleanup
        }

        // Delete existing documents
        const { error: deleteDocsError } = await supabase
          .from('documents')
          .delete()
          .eq('application_id', id);

        if (deleteDocsError) throw deleteDocsError;

        // Insert new documents
        const documentInserts = Object.entries(documents)
          .filter(([key, link]) => link.trim() !== '')
          .map(([key, link]) => {
            const index = parseInt(key.replace('doc_', ''));
            const documentName = DOCUMENT_REQUIREMENTS[index];
            
            return {
              application_id: id,
              title: documentName,
              drive_link: link.trim(),
              created_by: user.id,
              document_category: 'mutasi_terpadu',
              document_index: index
            };
          });

        if (documentInserts.length > 0) {
          const { error: documentsError } = await supabase
            .from('documents')
            .insert(documentInserts);

          if (documentsError) throw documentsError;
        }

        console.log('Successfully resubmitted application for re-verification:', {
          applicationId: id,
          status: 'submitted',
          documentsCount: documentInserts.length
        });

        toast({
          title: "Berhasil",
          description: `Perbaikan usulan mutasi untuk ${application.employee_data.employee_name} berhasil dikirim ulang!`,
        });

        // Clear edit state and navigate back
        setIsEditing(false);
        setDocumentVerificationStatus({});
        setFixedDocuments(new Set());
        setDocuments({});
        setAdditionalNotes('');
        navigate('/status'); // Navigate to status page instead of creation page

      } else {
        // Submit new application
        const { error } = await supabase
          .from('applications')
          .update({ 
            status: 'submitted',
            tanggal_pengajuan: new Date().toISOString(),
            keterangan: `Kategori: Mutasi Terpadu${additionalNotes ? ` - ${additionalNotes}` : ''}`
          })
          .eq('id', application.id);

        if (error) throw error;

        // Insert documents
        const documentInserts = Object.entries(documents)
          .filter(([key, link]) => link.trim() !== '')
          .map(([key, link]) => {
            const index = parseInt(key.replace('doc_', ''));
            const documentName = DOCUMENT_REQUIREMENTS[index];
            
            return {
              application_id: id,
              title: documentName,
              drive_link: link.trim(),
              created_by: user.id,
              document_category: 'mutasi_terpadu',
              document_index: index
            };
          });

        if (documentInserts.length > 0) {
          const { error: documentsError } = await supabase
            .from('documents')
            .insert(documentInserts);

          if (documentsError) throw documentsError;
        }

        toast({
          title: "Berhasil",
          description: `Pengajuan mutasi untuk ${application.employee_data.employee_name} berhasil disubmit dan sedang menunggu verifikasi!`,
        });

        navigate('/status'); // Navigate to status page
      }

    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: isEditing ? "Gagal mengirim ulang usulan mutasi" : "Gagal submit pengajuan mutasi",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, keterangan?: string) => {
    // Check if this is a resubmitted application
    const isResubmitted = keterangan?.includes('Perbaikan - Diajukan Ulang');
    
    if (status === 'submitted' && isResubmitted) {
      return <Badge className="bg-blue-100 text-blue-700">Menunggu Verifikasi Ulang</Badge>;
    }
    
    const statusMap = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
      submitted: { label: "Menunggu Verifikasi", className: "bg-gray-100 text-gray-700" },
      in_review: { label: "Sudah Diperbaiki", className: "bg-orange-100 text-orange-700" },
      approved: { label: "Diproses", className: "bg-blue-100 text-blue-700" },
      rejected: { label: "Ditolak", className: "bg-red-100 text-red-700" },
      revision_needed: { label: "Perlu Perbaikan", className: "bg-yellow-100 text-yellow-700" }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-700">✓ Diproses</Badge>;
      case 'needs_fix':
        return <Badge className="bg-red-100 text-red-700">✗ Perlu Diperbaiki</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">⏳ Menunggu</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Belum Diperiksa</Badge>;
    }
  };

  const canEdit = application?.status === 'draft' || application?.status === 'revision_needed' || isEditing;
  const submittedDocumentsCount = Object.values(documents).filter(link => link.trim() !== '').length;
  const allDocumentsCompleted = DOCUMENT_REQUIREMENTS.every((_, index) => {
    const docKey = `doc_${index}`;
    return documents[docKey] && documents[docKey].trim() !== '';
  });
  const canSaveDraft = canEdit;
  const canSubmit = canEdit && allDocumentsCompleted;
  const progressPercentage = Math.round((submittedDocumentsCount / DOCUMENT_REQUIREMENTS.length) * 100);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Memuat data pengajuan...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <p>Pengajuan tidak ditemukan</p>
          <Button onClick={() => navigate('/apps/pengajuan-mutasi-terpadu')} className="mt-4">
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/apps/pengajuan-mutasi-terpadu')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit Pengajuan Mutasi Terpadu' : 'Detail Pengajuan Mutasi Terpadu'}
          </h1>
          <p className="text-muted-foreground">
            {application.employee_data?.nomor_usulan || 'Nomor belum tersedia'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(application.status, application.keterangan)}
          {application.status === 'revision_needed' && !isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Edit Usulan
            </Button>
          )}
          {canSaveDraft && (
            <Button 
              onClick={handleSaveDraft} 
              disabled={isSubmitting || submittedDocumentsCount === 0}
              variant="outline"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Simpan Draft ({submittedDocumentsCount}/{DOCUMENT_REQUIREMENTS.length})
                </>
              )}
            </Button>
          )}
          {canSubmit && (
            <Button onClick={handleSubmitApplication} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Mengirim Perbaikan...' : 'Mengirim...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {isEditing ? 'Submit Perbaikan' : 'Submit Pengajuan'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Progress - Only show for draft and revision_needed status */}
      {(application.status === 'draft' || application.status === 'revision_needed') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Progress Pengajuan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {application.status === 'revision_needed' 
                    ? 'Dokumen perbaikan yang sudah diupload' 
                    : 'Dokumen yang sudah diupload'
                  }
                </span>
                <span>
                  {application.status === 'revision_needed' 
                    ? Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix' && documents[Object.keys(documentVerificationStatus).find(key => documentVerificationStatus[key] === v) || '']?.trim() !== '').length
                    : submittedDocumentsCount
                  } dari {application.status === 'revision_needed' 
                    ? Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix').length 
                    : DOCUMENT_REQUIREMENTS.length
                  }
                </span>
              </div>
              <Progress value={
                application.status === 'revision_needed' 
                  ? Math.round((Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix' && documents[Object.keys(documentVerificationStatus).find(key => documentVerificationStatus[key] === v) || '']?.trim() !== '').length / Math.max(Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix').length, 1)) * 100)
                  : progressPercentage
              } className="w-full" />
              <p className="text-xs text-muted-foreground">
                {application.status === 'revision_needed' 
                  ? Math.round((Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix' && documents[Object.keys(documentVerificationStatus).find(key => documentVerificationStatus[key] === v) || '']?.trim() !== '').length / Math.max(Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix').length, 1)) * 100)
                  : progressPercentage
                }% selesai
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Timeline Pengajuan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Horizontal timeline container */}
            <div className="flex items-center justify-between relative">
              {/* Background connecting line */}
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 z-0"></div>
              
              {/* Active connecting lines */}
              {(application?.status === 'submitted' || application?.status === 'approved' || application?.status === 'revision_needed') && (
                <div className="absolute top-6 left-6 h-0.5 bg-green-500 z-10" style={{ width: 'calc(50% - 12px)' }}></div>
              )}
              
              {application?.status === 'approved' && (
                <div className="absolute top-6 right-6 h-0.5 bg-green-500 z-10" style={{ width: 'calc(50% - 12px)' }}></div>
              )}
              
              {application?.status === 'revision_needed' && (
                <div className="absolute top-6 right-6 h-0.5 bg-yellow-500 z-10" style={{ width: 'calc(50% - 12px)' }}></div>
              )}

              {/* Timeline Step 1: Pengajuan dibuat */}
              <div className="flex flex-col items-center z-20 bg-white px-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2 relative">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-center min-w-0 max-w-32">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Pengajuan Dibuat</h4>
                  <p className="text-xs text-gray-600 break-words">
                    {new Date(application?.created_at || '').toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(application?.created_at || '').toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Timeline Step 2: Data telah diajukan */}
              <div className="flex flex-col items-center z-20 bg-white px-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 relative ${
                  (application?.status === 'submitted' || application?.status === 'approved' || application?.status === 'revision_needed') 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                }`}>
                  {(application?.status === 'submitted' || application?.status === 'approved' || application?.status === 'revision_needed') ? (
                    <Send className="w-6 h-6 text-white" />
                  ) : (
                    <Clock className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div className="text-center min-w-0 max-w-32">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Data Diajukan</h4>
                  {(application?.status === 'submitted' || application?.status === 'approved' || application?.status === 'revision_needed') ? (
                    <>
                      <p className="text-xs text-gray-600 break-words">
                        {application?.tanggal_pengajuan ? 
                          new Date(application.tanggal_pengajuan).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : 
                          new Date(application?.updated_at || '').toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        {application?.tanggal_pengajuan ? 
                          new Date(application.tanggal_pengajuan).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 
                          new Date(application?.updated_at || '').toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        }
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Menunggu</p>
                  )}
                </div>
              </div>

              {/* Timeline Step 3: Status akhir */}
              <div className="flex flex-col items-center z-20 bg-white px-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 relative ${
                  application?.status === 'approved' 
                    ? 'bg-green-500' 
                    : application?.status === 'revision_needed'
                    ? 'bg-yellow-500'
                    : 'bg-gray-300'
                }`}>
                  {application?.status === 'approved' ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : application?.status === 'revision_needed' ? (
                    <AlertTriangle className="w-6 h-6 text-white" />
                  ) : (
                    <Clock className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div className="text-center min-w-0 max-w-32">
                  {application?.status === 'approved' ? (
                    <>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Disetujui & Diproses</h4>
                      <p className="text-xs text-gray-600 break-words">
                        {new Date(application?.updated_at || '').toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(application?.updated_at || '').toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </>
                  ) : application?.status === 'revision_needed' ? (
                    <>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Perlu Perbaikan</h4>
                      <p className="text-xs text-gray-600 break-words">
                        {new Date(application?.updated_at || '').toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(application?.updated_at || '').toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Menunggu Verifikasi</h4>
                      <p className="text-xs text-gray-500">Belum diproses</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Mode Summary */}
      {isEditing && Object.keys(documentVerificationStatus).length > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-orange-900 mb-2">Ringkasan Status Verifikasi</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700">✓ Diproses</Badge>
                <span className="text-green-800">
                  {Object.values(documentVerificationStatus).filter(v => v.status === 'approved').length} dokumen
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-700">✗ Perlu Diperbaiki</Badge>
                <span className="text-red-800">
                  {Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix').length} dokumen
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700">✓ Diperbaiki</Badge>
                <span className="text-blue-800">
                  {fixedDocuments.size} dokumen
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-700">⏳ Menunggu</Badge>
                <span className="text-yellow-800">
                  {Object.values(documentVerificationStatus).filter(v => v.status === 'pending').length} dokumen
                </span>
              </div>
            </div>
            {Object.values(documentVerificationStatus).some(v => v.status === 'needs_fix') && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm font-medium text-red-900">
                  Fokus pada dokumen yang perlu diperbaiki. Pastikan untuk menekan tombol "Perbaiki" setelah mengupdate link dokumen.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Detail Pengajuan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.employee_data && (
              <>
                <div>
                  <Label className="text-sm font-medium">Pegawai yang Dimutasi</Label>
                  <p className="mt-1 font-medium">{application.employee_data.employee_name}</p>
                  <p className="text-sm text-muted-foreground">
                    NIP: {application.employee_data.employee_nip}
                  </p>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Unit Asal</Label>
                  <p className="mt-1">{application.employee_data.unit_asal}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Unit Tujuan</Label>
                  <p className="mt-1 font-medium text-primary">{application.employee_data.unit_tujuan}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Jabatan Tujuan</Label>
                  <p className="mt-1 font-medium">{application.employee_data.jabatan_tujuan}</p>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Alasan Mutasi</Label>
                  <p className="mt-1 text-sm">{application.employee_data.alasan_mutasi}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Tanggal Pengajuan</Label>
                  <p className="mt-1 text-sm">
                    {new Date(application.created_at).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {isEditing ? 'Edit Dokumen Persyaratan' : 'Dokumen Persyaratan'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 mb-2">Panduan Edit Dokumen</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <span className="font-medium text-green-700">✓ Disetujui</span>: Dokumen sudah benar, tidak perlu diubah</p>
                  <p>• <span className="font-medium text-red-700">✗ Perlu Diperbaiki</span>: Dokumen harus diperbaiki dan diupload ulang</p>
                  <p>• <span className="font-medium text-yellow-700">⏳ Menunggu</span>: Dokumen belum diperiksa</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {DOCUMENT_REQUIREMENTS.map((requirement, index) => {
                const docKey = `doc_${index}`;
                const verificationStatus = documentVerificationStatus[docKey];
                const needsAttention = isEditing && verificationStatus?.status === 'needs_fix';
                const isApproved = verificationStatus?.status === 'approved';
                const isFixed = fixedDocuments.has(docKey);
                
                // In edit mode, only show documents that need fixing or are new
                if (isEditing && isApproved) {
                  return (
                    <div key={index} className="space-y-2 bg-green-50 border border-green-200 rounded-lg p-3 opacity-75">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-green-800">
                          {index + 1}. {requirement}
                        </Label>
                        {getVerificationStatusBadge(verificationStatus.status)}
                      </div>
                      <p className="text-xs text-green-700">Dokumen sudah disetujui, tidak perlu diubah</p>
                    </div>
                  );
                }
                
                return (
                  <div key={index} className={`space-y-2 ${needsAttention ? 'bg-red-50 border border-red-200 rounded-lg p-3' : ''} ${isFixed ? 'bg-blue-50 border border-blue-200' : ''}`}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`doc-${index}`} className={`text-sm font-medium ${needsAttention ? 'text-red-800' : isFixed ? 'text-blue-800' : ''}`}>
                        {index + 1}. {requirement}
                      </Label>
                      <div className="flex items-center gap-2">
                        {verificationStatus && getVerificationStatusBadge(verificationStatus.status)}
                        {isFixed && <Badge className="bg-blue-100 text-blue-700">✓ Diperbaiki</Badge>}
                      </div>
                    </div>
                    
                    {verificationStatus?.admin_notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                        <p className="text-xs font-medium text-yellow-800">Catatan Admin:</p>
                        <p className="text-xs text-yellow-700">{verificationStatus.admin_notes}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Input
                        id={`doc-${index}`}
                        placeholder="Masukkan link Google Drive dokumen..."
                        value={documents[docKey] || ""}
                        onChange={(e) => handleDocumentChange(index, e.target.value)}
                        className={needsAttention ? 'border-red-300 focus:border-red-500' : isFixed ? 'border-blue-300 focus:border-blue-500' : ''}
                        disabled={!canEdit}
                      />
                      {needsAttention && !isFixed && documents[docKey] && (
                        <Button 
                          onClick={() => handleMarkDocumentFixed(docKey)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                        >
                          Perbaiki
                        </Button>
                      )}
                      {documents[docKey] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(documents[docKey], '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    {isFixed && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-xs font-medium text-blue-800">✓ Dokumen telah diperbaiki</p>
                        <p className="text-xs text-blue-700">Dokumen ini telah ditandai sebagai diperbaiki dan siap untuk direview ulang.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Notes */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Catatan Tambahan</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Masukkan catatan atau keterangan tambahan jika diperlukan..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      {/* Document Verification Status */}
      {application.status !== 'draft' && (
        <DocumentVerificationStatus 
          applicationId={application.id} 
          applicationStatus={application.status} 
        />
      )}

      {/* Information Card */}
      {canEdit && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">Informasi Penting</h4>
                <p className="text-sm text-amber-800">
                  Pastikan semua dokumen yang diupload sudah sesuai dengan persyaratan dan dapat diakses melalui link Google Drive yang diberikan. 
                  Dokumen yang tidak lengkap atau tidak dapat diakses akan menyebabkan pengajuan dikembalikan untuk perbaikan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}