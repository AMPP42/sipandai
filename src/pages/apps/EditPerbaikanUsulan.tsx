import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import DocumentVerificationStatus from '@/components/applications/DocumentVerificationStatus';
// Icons
import { 
  Loader2, 
  AlertCircle, 
  FileText, 
  User, 
  Building, 
  AlertTriangle, 
  Check, 
  AlertCircle as AlertCircleIcon, 
  ArrowLeft,
  Send
} from 'lucide-react';

// UI Components
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useNavigate, useParams, useLocation } from 'react-router-dom';

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

  // Document requirements for mutation applications
  const MUTATION_DOCUMENT_REQUIREMENTS = [
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

// Define Application type
type Application = {
  id: string;
  status: string;
  // Add other application properties as needed
  [key: string]: any;
};

interface EmployeeData {
  employee_id: string;
  employee_name: string;
  employee_nip: string;
  unit_asal: string;
  position_id: string;
  unit_tujuan: string;
  jabatan_tujuan: string;
  alasan_mutasi: string;
  nomor_usulan: string;
}

interface ApplicationDetail extends Application {
  id: string;
  status: string;
  employee_data?: EmployeeData;
}

interface DocumentVerificationStatus {
  [key: string]: {
    status: 'approved' | 'needs_fix' | 'pending';
    admin_notes?: string;
    document_name: string;
  };
}

interface Employee {
  id: string;
  name: string;
  nip: string;
  unit: string;
  position: string;
}

interface Position {
  id: string;
  name: string;
  unit: string;
}

const EditPerbaikanUsulan: React.FC = () => {
  // State hooks
  const [categoryDocuments, setCategoryDocuments] = useState<string[]>([]);
  const [documents, setDocuments] = useState<{ [key: string]: string }>({});
  const [isEditing, setIsEditing] = useState(true);
  const [documentVerificationStatus, setDocumentVerificationStatus] = useState<DocumentVerificationStatus>({});
  const [fixedDocuments, setFixedDocuments] = useState<Set<string>>(new Set());
  const [savedDocuments, setSavedDocuments] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [workUnits, setWorkUnits] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // No need for promotion categories in this component
  
  // Get document requirements for mutation applications
  const getDocumentRequirements = () => {
    return [...MUTATION_DOCUMENT_REQUIREMENTS];
  };

  // Router and auth hooks
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get documents for mutation application
  const getCategoryDocuments = useCallback((app: ApplicationDetail | null | undefined) => {
    console.log('Getting documents for mutasi application:', {
      hasApplication: !!app,
      applicationId: app?.id,
      applicationStatus: app?.status,
      applicationData: app?.employee_data
    });

    // Always return the mutation document requirements
    const documents = [...MUTATION_DOCUMENT_REQUIREMENTS];
    
    console.log('Using mutation document requirements:', {
      documentCount: documents.length
    });

    return documents;
  }, []);

  // Load document requirements when component mounts
  useEffect(() => {
    if (application) {
      const docs = getDocumentRequirements();
      setCategoryDocuments(docs);
    }
  }, [application]);

  // Edit form state (for revision, we usually don't allow changing employee/position, only documents)

  useEffect(() => {
    if (id) {
      loadApplication();
    }
  }, [id]);

  useEffect(() => {
    if (application?.status === 'revision_needed') {
      loadApplicationForEdit();
    }
  }, [application]);

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
      // Load existing documents
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

      // Populate documents
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

      // Mark all documents that need fixing as not fixed initially
      Object.entries(verificationStatus).forEach(([docKey, verification]) => {
        if (verification.status === 'needs_fix') {
          // Don't add to fixedDocuments initially - user needs to mark them as fixed
        }
      });

      // Mark all loaded documents as saved
      Object.keys(loadedDocuments).forEach(docKey => {
        setSavedDocuments(prev => new Set(prev).add(docKey));
      });

      toast({
        title: "Data Dimuat",
        description: "Data usulan perbaikan berhasil dimuat untuk diedit"
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
      description: "Dokumen telah ditandai sebagai diperbaiki dan dikunci"
    });
  };

  const handleUnmarkDocumentFixed = (docKey: string) => {
    setFixedDocuments(prev => {
      const newSet = new Set(prev);
      newSet.delete(docKey);
      return newSet;
    });
    toast({
      title: "Edit Dokumen",
      description: "Dokumen dapat diedit kembali"
    });
  };

  const handleSaveDocument = (docKey: string) => {
    setSavedDocuments(prev => new Set(prev).add(docKey));
    toast({
      title: "Dokumen Disimpan",
      description: "Link dokumen telah disimpan dan dikunci"
    });
  };

  const handleEditDocument = (docKey: string) => {
    setSavedDocuments(prev => {
      const newSet = new Set(prev);
      newSet.delete(docKey);
      return newSet;
    });
    toast({
      title: "Edit Dokumen",
      description: "Dokumen dapat diedit kembali"
    });
  };

  const handleSubmitApplication = async () => {
    if (!application || !application.employee_data) return;

    // Check if all documents that need fixing are marked as fixed
    const documentsNeedingFix = Object.entries(documentVerificationStatus)
      .filter(([_, verification]) => verification.status === 'needs_fix');

    const allFixed = documentsNeedingFix.every(([docKey, _]) =>
      fixedDocuments.has(docKey) && documents[docKey] && documents[docKey].trim() !== ''
    );

    if (!allFixed) {
      toast({
        title: "Error",
        description: "Tandai semua dokumen yang perlu diperbaiki sebagai 'Diperbaiki' sebelum submit",
        variant: "destructive"
      });
      return;
    }

    // Check if all required documents have links
    const allDocumentsProvided = MUTATION_DOCUMENT_REQUIREMENTS.every((_, index) => {
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

      // Update application status to submitted for re-verification
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'submitted',
          keterangan: `Perbaikan - Diajukan Ulang - Kategori: Mutasi Terpadu${additionalNotes ? ` - ${additionalNotes}` : ''}`,
          updated_at: new Date().toISOString(),
          progress: 20,
          detailed_verification_status: 'not_started'
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update existing documents with new links and mark verifications as fixed
      for (const [docKey, newLink] of Object.entries(documents)) {
        if (newLink && newLink.trim() !== '') {
          const index = parseInt(docKey.replace('doc_', ''));
          const documentName = categoryDocuments[index] || `Dokumen ${index + 1}`;

          // Check if document already exists
          const { data: existingDoc, error: fetchError } = await supabase
            .from('documents')
            .select('id')
            .eq('application_id', id)
            .eq('document_index', index)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw fetchError;
          }

          if (existingDoc) {
            // Update existing document
            const { error: updateDocError } = await supabase
              .from('documents')
              .update({
                drive_link: newLink.trim()
              })
              .eq('id', existingDoc.id);

            if (updateDocError) throw updateDocError;

            // Update corresponding verification status
            const { error: updateVerificationError } = await supabase
              .from('document_verifications')
              .update({
                status: 'approved',
                document_link: newLink.trim(),
                verified_at: new Date().toISOString(),
                admin_notes: 'Dokumen telah diperbaiki oleh pengguna'
              })
              .eq('application_id', id)
              .eq('document_type', docKey);

            if (updateVerificationError) throw updateVerificationError;
          } else {
            // Create new document
            const { error: insertDocError } = await supabase
              .from('documents')
              .insert({
                application_id: id,
                title: documentName,
                drive_link: newLink.trim(),
                created_by: user.id,
                document_category: 'mutasi_terpadu',
                document_index: index
              });

            if (insertDocError) throw insertDocError;

            // Create corresponding verification record
            const { error: insertVerificationError } = await supabase
              .from('document_verifications')
              .insert({
                application_id: id,
                document_name: documentName,
                document_type: docKey,
                document_link: newLink.trim(),
                status: 'approved',
                verified_at: new Date().toISOString(),
                verified_by: user.id
              });

            if (insertVerificationError) throw insertVerificationError;
          }
        }
      }

      // Mark any remaining documents that need fixing as still needing attention
      const { error: markRemainingError } = await supabase
        .from('document_verifications')
        .update({
          status: 'needs_fix',
          admin_notes: 'Dokumen belum diperbaiki oleh pengguna'
        })
        .eq('application_id', id)
        .eq('status', 'needs_fix')
        .is('verified_at', null);

      if (markRemainingError) throw markRemainingError;

      setApplicationSubmitted(true);
      toast({
        title: "Berhasil",
        description: `Perbaikan usulan untuk ${application.employee_data.employee_name} berhasil dikirim ulang!`
      });

      // Navigate back to main integrated app page
      navigate('/apps/pengajuan-mutasi-terpadu', { replace: true });

    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim ulang usulan perbaikan",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Memuat data perbaikan...</span>
        </div>
      </div>
    );
  }

  if (!application || application.status !== 'revision_needed') {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Usulan Perbaikan Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-4">
              Usulan yang perlu diperbaiki tidak ditemukan atau sudah tidak berstatus perlu perbaikan.
            </p>
            <Button onClick={() => navigate('/apps/pengajuan-mutasi-terpadu')}>
              Kembali ke Daftar Pengajuan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const documentsNeedingFix = Object.entries(documentVerificationStatus)
    .filter(([_, verification]) => verification.status === 'needs_fix');

  const allFixed = documentsNeedingFix.every(([docKey, _]) =>
    fixedDocuments.has(docKey) && documents[docKey] && documents[docKey].trim() !== ''
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/apps/pengajuan-mutasi-terpadu')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="warning">Perlu Perbaikan</Badge>
          <h1 className="text-3xl font-bold">Edit Perbaikan Usulan</h1>
        </div>
      </div>

      {/* Revision Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Usulan ini memerlukan perbaikan berdasarkan feedback dari admin. Perbaiki dokumen yang ditandai dan submit ulang untuk verifikasi.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informasi Pengajuan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.employee_data && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{application.employee_data.employee_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">NIP:</span>
                    <span className="font-mono text-sm">{application.employee_data.employee_nip}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{application.employee_data.unit_asal} → {application.employee_data.unit_tujuan}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Jabatan:</span>
                    <span className="text-sm">{application.employee_data.jabatan_tujuan}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Nomor Usulan:</span>
                    <span className="font-mono text-sm">{application.employee_data.nomor_usulan}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Documents Needing Fix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Dokumen Perlu Diperbaiki ({documentsNeedingFix.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documentsNeedingFix.map(([docKey, verification]) => {
                const isFixed = fixedDocuments.has(docKey);
                const index = parseInt(docKey.replace('doc_', ''));

                return (
                  <div key={docKey} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{index + 1}.</span>
                      <span className="text-sm">{verification.document_name}</span>
                      {isFixed && <Check className="w-4 h-4 text-green-600" />}
                    </div>
                    <Button
                      size="sm"
                      variant={isFixed ? "outline" : "default"}
                      onClick={() => isFixed ? handleUnmarkDocumentFixed(docKey) : handleMarkDocumentFixed(docKey)}
                    >
                      {isFixed ? 'Batalkan' : 'Tandai Diperbaiki'}
                    </Button>
                  </div>
                );
              })}
              {documentsNeedingFix.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Tidak ada dokumen yang perlu diperbaiki
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>4. Dokumen Persyaratan Mutasi</span>
          </CardTitle>
        </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categoryDocuments.map((documentName, index) => {
              const docKey = `doc_${index}`;
              const verification = documentVerificationStatus[docKey];
              const isSaved = savedDocuments.has(docKey);
              const needsFix = verification?.status === 'needs_fix';
              const isFixed = fixedDocuments.has(docKey);
              const hasLink = documents[docKey] && documents[docKey].trim() !== '';

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-primary min-w-6">
                        {index + 1}.
                      </span>
                      <Label className="text-sm font-medium">{documentName}</Label>

                      {/* Status indicators */}
                      <div className="flex items-center gap-1">
                        {verification && (
                          <Badge
                            variant={
                              verification.status === 'approved' ? 'default' :
                              verification.status === 'needs_fix' ? 'destructive' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {verification.status === 'approved' ? '✓ Disetujui' :
                             verification.status === 'needs_fix' ? '✗ Perlu diperbaiki' : '⏳ Pending'}
                          </Badge>
                        )}
                        {needsFix && isFixed && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            ✓ Diperbaiki
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {isSaved ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditDocument(docKey)}
                        >
                          Edit
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSaveDocument(docKey)}
                          disabled={!hasLink}
                        >
                          Simpan
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Admin notes if any */}
                  {verification?.admin_notes && (
                    <Alert className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Catatan Admin:</strong> {verification.admin_notes}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Input
                    placeholder="Masukkan link Google Drive..."
                    value={documents[docKey] || ''}
                    onChange={(e) => handleDocumentChange(index, e.target.value)}
                    disabled={isSaved}
                    className={needsFix && !isFixed ? 'border-orange-300 focus:border-orange-500' : ''}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit Section */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Perbaikan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="additional-notes">Catatan Tambahan (Opsional)</Label>
            <Textarea
              id="additional-notes"
              placeholder="Tambahkan catatan jika ada perubahan lain..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="min-h-20"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              onClick={handleSubmitApplication}
              disabled={isSubmitting || !allFixed}
              className="btn-primary"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Mengirim...' : 'Kirim Perbaikan'}
            </Button>
          </div>

          {!allFixed && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Tandai semua dokumen yang perlu diperbaiki sebagai "Diperbaiki" sebelum submit.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EditPerbaikanUsulan;
