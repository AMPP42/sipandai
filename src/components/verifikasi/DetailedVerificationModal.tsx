import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, FileText, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ApplicationItem {
  id: string;
  type: 'usulan_mutasi' | 'application';
  nomor_usulan?: string;
  judul?: string;
  nama_pegawai?: string;
  submitter_name?: string;
  unit_asal?: string;
  unit_tujuan?: string;
  submitter_unit?: string;
  jenis_mutasi?: string;
  jenis?: string;
  alasan_mutasi?: string;
  keterangan?: string;
  estimasi?: string;
  tanggal_usulan?: string;
  tanggal_pengajuan?: string;
  status: string;
  catatan_reviewer?: string;
  user_id?: string;
  submitter_id?: string;
  created_at: string;
  detailed_verification_status?: string;
}

interface DocumentVerification {
  id: string;
  application_id: string;
  document_type: string;
  document_name: string;
  status: 'pending' | 'approved' | 'needs_fix';
  admin_notes?: string;
  verified_by?: string;
  verified_at?: string;
  document_id?: string;
  document_link?: string;
}

interface ActualDocument {
  id: string;
  title: string;
  drive_link?: string;
  document_category?: string;
  document_index?: number;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ApplicationItem | null;
  onVerificationComplete: () => void;
}

// This function is no longer used - we load actual documents from database

export default function DetailedVerificationModal({ open, onOpenChange, application, onVerificationComplete }: Props) {
  const { user } = useAuth();
  const [documentVerifications, setDocumentVerifications] = useState<DocumentVerification[]>([]);
  const [actualDocuments, setActualDocuments] = useState<ActualDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && application) {
      loadDocumentVerifications();
    }
  }, [open, application]);

  const loadDocumentVerifications = async () => {
    if (!application) return;

    setLoading(true);
    try {
      let documents: ActualDocument[] = [];
      
      // For Kenaikan Pangkat applications, extract documents from estimasi JSON
      if (application.jenis === 'kenaikan_pangkat' && application.estimasi) {
        try {
          const estimasiData = JSON.parse(application.estimasi);
          if (estimasiData.document_links) {
            // Create document objects from the links in estimasi
            documents = Object.entries(estimasiData.document_links).map(([key, link], index) => ({
              id: `${application.id}-${key}`,
              title: getKenaikanPangkatDocumentName(key, estimasiData.kategori),
              drive_link: link as string,
              document_category: 'kenaikan_pangkat',
              document_index: index,
              created_at: application.created_at
            }));
          }
        } catch (parseError) {
          console.error('Error parsing estimasi JSON:', parseError);
        }
      } else {
        // For other applications, load from documents table
        const { data: documentsData, error: documentsError } = await supabase
          .from('documents')
          .select('*')
          .eq('application_id', application.id)
          .order('document_index');

        if (documentsError) throw documentsError;
        documents = (documentsData || []) as ActualDocument[];
      }

      setActualDocuments(documents);

      // Load existing verifications
      const { data: verifications, error: verificationsError } = await supabase
        .from('document_verifications')
        .select('*')
        .eq('application_id', application.id)
        .order('document_type');

      if (verificationsError) throw verificationsError;

      // If no verifications exist, create initial ones based on actual uploaded documents
      if (!verifications || verifications.length === 0) {
        await initializeDocumentVerifications(documents || []);
      } else {
        setDocumentVerifications(verifications as DocumentVerification[]);
      }
    } catch (error) {
      console.error('Error loading document verifications:', error);
      toast.error('Gagal memuat data verifikasi dokumen');
    } finally {
      setLoading(false);
    }
  };

  const getKenaikanPangkatDocumentName = (key: string, kategori?: string) => {
    // Get document names based on category and key index to match the application form exactly
    const getDocumentsByCategory = (kategori: string) => {
      const documents: Record<string, string[]> = {
        reguler: [
          "SKP 2 tahun terakhir",
          "SK Jabatan terakhir", 
          "SK Pangkat terakhir",
          "Kartu Pegawai",
          "Ijazah + Transkrip Nilai terakhir",
          "Nota Dinas"
        ],
        fungsional: [
          "PAK tahun 2022 hingga saat ini",
          "SKP 2 tahun terakhir",
          "SK Jabatan terakhir", 
          "SK Pangkat terakhir",
          "Kartu Pegawai",
          "Ijazah + Transkrip Nilai terakhir",
          "Nota Dinas"
        ],
        struktural: [
          "SKP 2 tahun terakhir",
          "SK Jabatan terakhir",
          "SK Pangkat terakhir", 
          "Kartu Pegawai",
          "Ijazah + Transkrip Nilai terakhir",
          "Surat Pernyataan Pelantikan",
          "Surat Pernyataan Melaksanakan Tugas",
          "Diklatsus PIM III (khusus Eselon III dengan S1 dan pangkat terakhir S1)",
          "Nota Dinas"
        ],
        pertama_kali: [
          "SK CPNS",
          "SK PNS",
          "SKP 2 tahun terakhir",
          "PAK tahun 2022 hingga saat ini",
          "SK Jabatan",
          "Berita Acara Pengambilan Sumpah Jabatan PNS",
          "SK Pangkat terakhir",
          "Kartu Pegawai",
          "Ijazah + Transkrip Nilai terakhir",
          "Nota Dinas"
        ],
        penyesuaian_ijazah: [
          "Surat Tanda Lulus Ujian Penyesuaian Kenaikan Pangkat",
          "Ijazah + Transkrip Nilai terakhir yang telah dilegalisir",
          "Uraian Tugas",
          "SKP 2 tahun terakhir",
          "SK Jabatan terakhir",
          "SK Pangkat terakhir",
          "Kartu Pegawai",
          "Ijazah + Transkrip Nilai terakhir",
          "Nota Dinas"
        ],
        iid_ke_iiia: [
          "Surat Tanda Lulus Ujian Dinas",
          "SKP 2 tahun terakhir",
          "SK Jabatan",
          "SK Pangkat terakhir",
          "Kartu Pegawai",
          "Ijazah + Transkrip Nilai terakhir",
          "Nota Dinas"
        ]
      };
      return documents[kategori] || [];
    };

    // Extract doc index from key (e.g., 'doc-0' -> 0)
    const docIndex = parseInt(key.replace('doc-', ''));
    
    if (kategori) {
      const categoryDocs = getDocumentsByCategory(kategori);
      return categoryDocs[docIndex] || `Dokumen ${docIndex + 1}`;
    }
    
    // Fallback for legacy data without category
    const fallbackNames: Record<string, string> = {
      'doc-0': 'SKP 2 tahun terakhir',
      'doc-1': 'SK Jabatan terakhir', 
      'doc-2': 'SK Pangkat terakhir',
      'doc-3': 'Kartu Pegawai',
      'doc-4': 'Ijazah + Transkrip Nilai terakhir',
      'doc-5': 'Nota Dinas'
    };
    return fallbackNames[key] || `Dokumen ${key}`;
  };

  const initializeDocumentVerifications = async (documents: ActualDocument[]) => {
    if (!application || !documents || documents.length === 0) {
      console.log('Cannot initialize - no application or documents:', { application: !!application, documentsCount: documents?.length });
      return;
    }

    console.log('Initializing verifications for documents:', documents);

    const initialVerifications = documents.map(doc => ({
      application_id: application.id,
      document_type: `doc_${doc.document_index || 0}`,
      document_name: doc.title,
      status: 'pending' as const,
      document_id: doc.id.startsWith(application.id) ? null : doc.id, // For Kenaikan Pangkat, don't use concatenated id
      document_link: doc.drive_link
    }));

    try {
      const { data, error } = await supabase
        .from('document_verifications')
        .insert(initialVerifications)
        .select();

      if (error) {
        console.error('Error inserting verifications:', error);
        throw error;
      }
      
      console.log('Successfully created verifications:', data);
      setDocumentVerifications((data || []) as DocumentVerification[]);
    } catch (error) {
      console.error('Error initializing document verifications:', error);
      toast.error('Gagal menginisialisasi verifikasi dokumen');
    }
  };

  const updateDocumentStatus = async (verificationId: string, status: 'pending' | 'approved' | 'needs_fix', notes?: string) => {
    try {
      const { error } = await supabase
        .from('document_verifications')
        .update({
          status,
          admin_notes: notes || null,
          verified_by: user?.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', verificationId);

      if (error) throw error;

      // Update local state
      setDocumentVerifications(prev => 
        prev.map(doc => 
          doc.id === verificationId 
            ? { ...doc, status, admin_notes: notes, verified_by: user?.id, verified_at: new Date().toISOString() }
            : doc
        )
      );

      toast.success('Status dokumen berhasil diperbarui');
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Gagal memperbarui status dokumen');
    }
  };

  const submitFinalVerification = async () => {
    if (!application) return;

    setSaving(true);
    try {
      // Check if all documents are verified (either approved or needs_fix)
      const pendingDocs = documentVerifications.filter(doc => doc.status === 'pending');
      
      if (pendingDocs.length > 0) {
        toast.error('Harap verifikasi semua dokumen terlebih dahulu');
        return;
      }

      // Check if any documents need fixing
      const docsNeedingFix = documentVerifications.filter(doc => doc.status === 'needs_fix');
      const allApproved = docsNeedingFix.length === 0;

      // Update application status based on verification results
      const newStatus = allApproved ? 'approved' : 'revision_needed';
      
      if (application.type === 'usulan_mutasi') {
        const { error } = await supabase
          .from('usulan_mutasi')
          .update({
            status: newStatus,
            catatan_reviewer: allApproved 
              ? 'Semua dokumen telah diverifikasi dan disetujui'
              : `${docsNeedingFix.length} dokumen perlu diperbaiki`,
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', application.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('applications')
          .update({
            status: newStatus
          })
          .eq('id', application.id);

        if (error) throw error;

        // Log workflow change
        await supabase
          .from('workflows')
          .insert({
            application_id: application.id,
            from_status: application.status as any,
            to_status: newStatus,
            actor_id: user?.id,
            note: allApproved 
              ? 'Semua dokumen telah diverifikasi dan disetujui'
              : `${docsNeedingFix.length} dokumen perlu diperbaiki`
          });
      }

      toast.success(allApproved ? 'Usulan berhasil disetujui' : 'Usulan dikembalikan untuk perbaikan');
      onVerificationComplete();
      onOpenChange(false);

    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error('Gagal menyimpan hasil verifikasi');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Disetujui</Badge>;
      case 'needs_fix':
        return <Badge variant="outline" className="text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1" />Perlu Perbaikan</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getApplicationTitle = () => {
    if (!application) return '';
    return application.type === 'usulan_mutasi' 
      ? application.nomor_usulan || ''
      : application.judul || '';
  };

  const getApplicantName = () => {
    if (!application) return '';
    return application.type === 'usulan_mutasi'
      ? application.nama_pegawai || ''
      : application.submitter_name || '';
  };

  const getApplicationCategory = () => {
    if (!application) return 'Tidak ada keterangan';
    
    if (application.jenis === 'kenaikan_pangkat' && application.estimasi) {
      try {
        const estimasiData = JSON.parse(application.estimasi);
        return estimasiData.kategori_name || estimasiData.kategori || 'Tidak ada kategori';
      } catch {
        return 'Tidak dapat memuat kategori';
      }
    }
    
    return application.keterangan || 'Tidak ada keterangan';
  };

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Verifikasi Detail Persyaratan
          </DialogTitle>
          <DialogDescription>
            {getApplicationTitle()} - {getApplicantName()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Pengajuan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nama Pengaju</label>
                  <p className="text-sm">{getApplicantName()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unit</label>
                  <p className="text-sm">
                    {application.type === 'usulan_mutasi' 
                      ? application.unit_asal 
                      : application.submitter_unit}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Jenis Pengajuan</label>
                  <p className="text-sm">
                    {application.type === 'usulan_mutasi' 
                      ? application.jenis_mutasi 
                      : application.jenis === 'pensiun' ? 'Pengajuan Pensiun'
                      : application.jenis === 'mutasi' ? 'Pengajuan Mutasi'
                      : application.jenis === 'kenaikan_pangkat' ? 'Kenaikan Pangkat'
                      : application.jenis}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Kategori</label>
                  <p className="text-sm">{getApplicationCategory()}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Total Dokumen Diupload</label>
                  <p className="text-sm">{actualDocuments.length} dokumen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Document Verification */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Verifikasi Persyaratan Dokumen</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                Periksa dan beri status pada setiap dokumen persyaratan
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : documentVerifications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Belum Ada Dokumen</h3>
                <p className="text-muted-foreground">
                  {actualDocuments.length === 0 
                    ? 'Pengajuan ini belum memiliki dokumen yang diupload.'
                    : `Ditemukan ${actualDocuments.length} dokumen, tetapi belum ada verifikasi yang dibuat.`}
                </p>
                {actualDocuments.length > 0 && (
                  <Button 
                    className="mt-4" 
                    onClick={() => initializeDocumentVerifications(actualDocuments)}
                  >
                    Inisialisasi Verifikasi
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {documentVerifications.map((verification, index) => (
                  <Card key={verification.id} className="border-l-4 border-l-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{verification.document_name}</h4>
                            {getStatusBadge(verification.status)}
                          </div>

                          {/* Document Link */}
                          {verification.document_link && (
                            <div className="mb-3 p-2 bg-gray-50 rounded border">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">Dokumen yang diupload:</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <a 
                                  href={verification.document_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Lihat Dokumen
                                </a>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">Google Drive</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground block mb-1">
                                Status Verifikasi
                              </label>
                              <Select
                                value={verification.status}
                                onValueChange={(value) => {
                                  if (value === 'approved') {
                                    updateDocumentStatus(verification.id, value);
                                  } else {
                                    // For pending and needs_fix, we need to handle notes
                                    setDocumentVerifications(prev => 
                                      prev.map(doc => 
                                        doc.id === verification.id 
                                          ? { ...doc, status: value as any }
                                          : doc
                                      )
                                    );
                                  }
                                }}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Menunggu Verifikasi</SelectItem>
                                  <SelectItem value="approved">Sudah Sesuai</SelectItem>
                                  <SelectItem value="needs_fix">Perlu Perbaikan</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {(verification.status === 'needs_fix' || verification.admin_notes) && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground block mb-1">
                                  Catatan Verifikator
                                </label>
                                <Textarea
                                  value={verification.admin_notes || ''}
                                  onChange={(e) => {
                                    setDocumentVerifications(prev => 
                                      prev.map(doc => 
                                        doc.id === verification.id 
                                          ? { ...doc, admin_notes: e.target.value }
                                          : doc
                                      )
                                    );
                                  }}
                                  placeholder={
                                    verification.status === 'needs_fix' 
                                      ? 'Jelaskan apa yang perlu diperbaiki...'
                                      : 'Catatan tambahan (opsional)...'
                                  }
                                  className="min-h-[80px]"
                                />
                                {verification.status === 'needs_fix' && (
                                  <Button
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => updateDocumentStatus(
                                      verification.id, 
                                      'needs_fix', 
                                      verification.admin_notes
                                    )}
                                  >
                                    Simpan Status & Catatan
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Final Action */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
            <Button 
              onClick={submitFinalVerification}
              disabled={saving || documentVerifications.some(doc => doc.status === 'pending')}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? 'Menyimpan...' : 'Selesai Verifikasi'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}