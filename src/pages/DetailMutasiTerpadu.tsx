import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import DocumentVerificationStatus from '@/components/applications/DocumentVerificationStatus';
import { ArrowLeft, User, Building, Calendar, FileText, Upload, Download, CheckCircle, AlertCircle, Clock, Send, Loader2, AlertTriangle, Eye, FileCheck, XCircle, ExternalLink } from 'lucide-react';
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
    kategori?: string;
    kategori_name?: string;
    periode?: string;
    unit?: string;
    jabatan?: string;
    pangkat?: string;
  };
}
interface DocumentVerificationStatus {
  [key: string]: {
    status: 'approved' | 'needs_fix' | 'pending';
    admin_notes?: string;
    document_name: string;
  };
}
const MUTASI_DOCUMENT_REQUIREMENTS = ['Surat Pernyataan Lolos Butuh dari PPK Instansi Asal (Asli)', 'Surat Keterangan Tidak Sedang Menjalani Hukuman Disiplin (Asli)', 'Surat Keterangan Tidak Sedang Menjalani Tugas Belajar/Ikatan Dinas (Asli)', 'Surat Keterangan Tidak Mempunyai Hutang Piutang dengan Pihak Bank (Asli)', 'Surat Pernyataan Bebas Temuan yang Diterbitkan oleh ITJEN (Asli)', 'ANJAB dan ABK yang ditandatangani oleh PPK Instansi Asal (Bila Pindah Antar Kementerian)', 'SK CPNS (Fotokopi legalisir)', 'SK PNS (Fotokopi legalisir)', 'SK Pangkat Terakhir (Fotokopi legalisir)', 'SK Jabatan Terakhir (Fotokopi legalisir)', 'KARPEG (Fotokopi legalisir)', 'Ijazah dan Transkrip Nilai Universitas (Fotokopi legalisir)', 'SKP 2 tahun terakhir (Fotokopi legalisir)', 'Surat permohonan mutasi dari ybs', 'Daftar Riwayat Hidup (DRH) sesuai Keputusan Kepala BKN Nomor 11 Tahun 2002', 'Nota Dinas Usulan Mutasi yang telah ditandatangani'];
export default function DetailMutasiTerpadu() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [documents, setDocuments] = useState<{
    [key: string]: string;
  }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [documentVerificationStatus, setDocumentVerificationStatus] = useState<DocumentVerificationStatus>({});
  const [fixedDocuments, setFixedDocuments] = useState<Set<string>>(new Set());
  const [savedDocuments, setSavedDocuments] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [documentRequirements, setDocumentRequirements] = useState<string[]>([]);
  const [showUploadNotaDinasDialog, setShowUploadNotaDinasDialog] = useState(false);
  const [showUploadSKDialog, setShowUploadSKDialog] = useState(false);
  const [showUpdateBiroStatusDialog, setShowUpdateBiroStatusDialog] = useState(false);
  const [notaDinasUrl, setNotaDinasUrl] = useState('');
  const [skUrl, setSkUrl] = useState('');
  const [biroStatus, setBiroStatus] = useState<'in_progress' | 'approved' | 'rejected'>('in_progress');
  const [biroRejectionNotes, setBiroRejectionNotes] = useState('');
  const [workflowLinks, setWorkflowLinks] = useState<{ [key: string]: string }>({});
  const [workflowData, setWorkflowData] = useState<{ [key: string]: { note?: string; created_at?: string; file_link?: string } }>({});
  
  useEffect(() => {
    if (id) {
      loadApplication();
      loadWorkflowLinks();
    }
  }, [id]);

  // Reload application and workflow links when window gains focus to get latest status
  useEffect(() => {
    const handleFocus = () => {
      if (id && !isEditing) {
        loadApplication();
        loadWorkflowLinks();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id, isEditing]);
  useEffect(() => {
    if (application) {
      loadDocumentRequirements();
    }
  }, [application]);
  useEffect(() => {
    if (application) {
      // Check if we're in edit mode or if status is revision_needed
      const urlParams = new URLSearchParams(location.search);
      const editMode = urlParams.get('edit');
      
      // Load existing documents first to preserve them
      if (application.status !== 'draft') {
        loadDocumentsForViewing();
      }
      
      if (editMode || application.status === 'revision_needed') {
        setIsEditing(true);
        loadApplicationForEdit();
      } else if (application.status === 'approved' || application.status === 'submitted') {
        // Load documents for viewing in approved/submitted status
        loadDocumentsForViewing();
      }
    }
  }, [application, location.search]);
  const loadDocumentRequirements = async () => {
    if (!application) return;
    try {
      if (application.jenis === 'mutasi_terpadu') {
        setDocumentRequirements(MUTASI_DOCUMENT_REQUIREMENTS);
      } else if (application.jenis === 'kenaikan_pangkat') {
        const employeeData = application.employee_data;
        const kategori = employeeData?.kategori || '';
        const {
          data,
          error
        } = await supabase.from('document_types').select('name').eq('category', `kenaikan_pangkat_${kategori}`).eq('is_active', true).order('code');
        if (error) throw error;
        setDocumentRequirements(data?.map(d => d.name) || []);
      } else if (application.jenis === 'pensiun') {
        const employeeData = application.employee_data;
        const kategori = employeeData?.kategori || '';
        const retirementDocs: {
          [key: string]: string[];
        } = {
          "pensiun_reguler": ["Surat Permohonan Pensiun dari Ybs (tanpa kop unit kerja)", "Daftar Susunan Keluarga - pastikan jumlah anak sama dengan di DPCPP", "Kartu Pegawai (KARPEG)", "Surat Nikah (Optional)", "Akte Kelahiran Anak (apabila masih ada anak yang menjadi tanggungan)", "SK Pengangkatan sebagai CPNS", "SK Pengangkatan CPNS menjadi PNS", "SK Kenaikan Pangkat terakhir", "Kenaikan Gaji Berkala Terakhir", "Penilaian Prestasi Kerja (SKP) 2 Tahun Terakhir", "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat dalam 1 Tahun Terakhir", "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana", "Foto Pegawai ybs", "Data Perorangan Calon Penerima Pensiun (DPCPP)", "Surat Keterangan Kematian (Bila ada suami/istri yang sudah meninggal dunia)", "KTP", "NPWP", "Buku Tabungan (lembar yang terdapat nomor rekening)", "Surat Keterangan Sekolah / Kuliah (bila terdapat anak yang masih menjadi tanggungan)"],
          "pensiun_janda_duda": ["Surat Permohonan Pensiun dari Janda / Duda Ybs (tanpa kop)", "Daftar Susunan Keluarga (Dokumen Asli)", "Kartu Pegawai (KARPEG) almarhum/ah", "Surat Nikah", "Akte Kelahiran Anak", "SK Pengangkatan sebagai CPNS almarhum/ah", "SK Pengangkatan CPNS menjadi PNS almarhum/ah", "SK Kenaikan Pangkat almarhum/ah", "Gaji Berkala Terakhir almarhum/ah", "Penilaian Prestasi Kerja 2 Tahun Terakhir almarhum/ah", "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat dalam 1 Tahun Terakhir almarhum/ah", "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana almarhum/ah", "Data Perorangan Calon Penerima Pensiun (DPCPP)", "Foto Janda / Duda ybs", "Surat Keterangan Kematian yang Sah (harus dari Dukcapil)", "Surat Keterangan Janda / Duda dari Kelurahan", "Kartu Istri (KARIS) utk pensiun janda atau Kartu Suami (KARSU) untuk pensiun duda", "KTP janda/duda/KK", "NPWP janda/duda", "Buku Tabungan janda/duda", "Surat Keterangan Sekolah / Kuliah (bila terdapat anak yang masih menjadi tanggungan)"]
        };
        setDocumentRequirements(retirementDocs[kategori] || []);
      }
    } catch (error) {
      console.error('Error loading document requirements:', error);
      setDocumentRequirements(MUTASI_DOCUMENT_REQUIREMENTS);
    }
  };
  
  const loadWorkflowLinks = async () => {
    try {
      console.log('Loading workflow links for application:', id);
      const { data, error } = await supabase
        .from('workflows')
        .select('to_status, file_link, note, created_at')
        .eq('application_id', id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading workflow links:', error);
        throw error;
      }
      
      console.log('Workflow data from database:', data);
      
      if (data) {
        const links: { [key: string]: string } = {};
        const workflows: { [key: string]: { note?: string; created_at?: string; file_link?: string } } = {};
        
        data.forEach(workflow => {
          const statusKey = workflow.to_status;
          console.log('Processing workflow:', { statusKey, file_link: workflow.file_link, note: workflow.note });
          
          // Store complete workflow data
          if (!workflows[statusKey]) {
            workflows[statusKey] = {
              note: workflow.note || undefined,
              created_at: workflow.created_at || undefined,
              file_link: workflow.file_link || undefined
            };
          }
          
          // Store file links separately for backward compatibility
          if (workflow.file_link && !links[statusKey]) {
            links[statusKey] = workflow.file_link;
          }
        });
        
        console.log('Final workflow links:', links);
        console.log('Final workflow data:', workflows);
        setWorkflowLinks(links);
        setWorkflowData(workflows);
      }
    } catch (error) {
      console.error('Error loading workflow links:', error);
    }
  };
  
  const loadApplication = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('applications').select('*').eq('id', id).single();
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
      const {
        data: documentsData,
        error: docsError
      } = await supabase.from('documents').select('*').eq('application_id', id).order('document_index');
      if (docsError) throw docsError;

      // Load document verification status
      const {
        data: verificationData,
        error: verificationError
      } = await supabase.from('document_verifications').select('*').eq('application_id', id);
      if (verificationError) throw verificationError;

      // Populate documents - preserve existing document links
      const loadedDocuments: {
        [key: string]: string;
      } = {};
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

  const loadDocumentsForViewing = async () => {
    try {
      // Load documents
      const {
        data: documentsData,
        error: docsError
      } = await supabase.from('documents').select('*').eq('application_id', id).order('document_index');
      if (docsError) throw docsError;

      // Populate documents
      const loadedDocuments: {
        [key: string]: string;
      } = {};
      documentsData?.forEach(doc => {
        if (doc.document_index !== null && doc.drive_link) {
          loadedDocuments[`doc_${doc.document_index}`] = doc.drive_link;
        }
      });
      setDocuments(loadedDocuments);
    } catch (error) {
      console.error('Error loading documents for viewing:', error);
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
      const {
        error: updateError
      } = await supabase.from('applications').update({
        status: 'draft',
        // Explicitly ensure status remains draft
        keterangan: `Kategori: Mutasi Terpadu${additionalNotes ? ` - ${additionalNotes}` : ''}`,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (updateError) throw updateError;

      // Delete existing documents first
      const {
        error: deleteDocsError
      } = await supabase.from('documents').delete().eq('application_id', id);
      if (deleteDocsError) throw deleteDocsError;

      // Determine document category based on application type
      const docCategory = application.jenis === 'mutasi_terpadu' ? 'mutasi_terpadu' : application.jenis === 'kenaikan_pangkat' ? 'kenaikan_pangkat' : application.jenis === 'pensiun' ? 'pensiun' : 'mutasi_terpadu';

      // Insert ALL documents from the form state, including empty ones as placeholders
      const documentInserts = documentRequirements.map((documentName, index) => {
        const docKey = `doc_${index}`;
        const linkValue = documents[docKey] || '';
        return {
          application_id: id,
          title: documentName,
          drive_link: linkValue.trim(),
          created_by: user.id,
          document_category: docCategory,
          document_index: index
        };
      }).filter(doc => doc.drive_link !== ''); // Only save documents with actual links

      if (documentInserts.length > 0) {
        const {
          error: documentsError
        } = await supabase.from('documents').insert(documentInserts);
        if (documentsError) throw documentsError;
      }
      setDraftSaved(true);
      toast({
        title: "Berhasil",
        description: `Draft disimpan dengan ${documentInserts.length} dokumen. Status tetap Draft.`
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
  const handleUploadNotaDinas = async () => {
    if (!notaDinasUrl.trim() || !application) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          nota_dinas_url: notaDinasUrl.trim(),
          nota_dinas_uploaded_at: new Date().toISOString(),
          biro_osdma_status: 'submitted'
        })
        .eq('id', application.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Nota Dinas berhasil diupload"
      });

      setShowUploadNotaDinasDialog(false);
      setNotaDinasUrl('');
      await loadApplication();
    } catch (error) {
      console.error('Error uploading nota dinas:', error);
      toast({
        title: "Error",
        description: "Gagal mengupload Nota Dinas",
        variant: "destructive"
      });
    }
  };

  const handleUpdateBiroStatus = async () => {
    if (!application) return;

    try {
      const updateData: any = {
        biro_osdma_status: biroStatus,
        biro_osdma_decision_at: new Date().toISOString()
      };

      if (biroStatus === 'rejected') {
        updateData.biro_osdma_rejection_notes = biroRejectionNotes.trim();
      }

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', application.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Status Biro OSDMA berhasil diupdate menjadi ${
          biroStatus === 'approved' ? 'Disetujui' : 
          biroStatus === 'rejected' ? 'Ditolak' : 
          'Dalam Proses'
        }`
      });

      setShowUpdateBiroStatusDialog(false);
      setBiroStatus('in_progress');
      setBiroRejectionNotes('');
      await loadApplication();
    } catch (error) {
      console.error('Error updating biro status:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate status Biro OSDMA",
        variant: "destructive"
      });
    }
  };

  const handleUploadSK = async () => {
    if (!skUrl.trim() || !application) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          sk_url: skUrl.trim(),
          sk_uploaded_at: new Date().toISOString()
        })
        .eq('id', application.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "SK berhasil diupload"
      });

      setShowUploadSKDialog(false);
      setSkUrl('');
      await loadApplication();
    } catch (error) {
      console.error('Error uploading SK:', error);
      toast({
        title: "Error",
        description: "Gagal mengupload SK",
        variant: "destructive"
      });
    }
  };

  const handleSubmitApplication = async () => {
    setShowSubmitConfirmation(false);
    if (!application || !application.employee_data) return;

    // Check if all documents are provided for final submission
    const allDocumentsProvided = documentRequirements.every((_, index) => {
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
        const {
          error: updateError
        } = await supabase.from('applications').update({
          status: 'submitted',
          keterangan: `Perbaikan - Diajukan Ulang - Kategori: Mutasi Terpadu${additionalNotes ? ` - ${additionalNotes}` : ''}`,
          updated_at: new Date().toISOString(),
          progress: 20,
          // Reset progress for resubmission
          detailed_verification_status: 'not_started' // Reset verification status
        }).eq('id', id);
        if (updateError) throw updateError;

        // Reset document verifications for admin to re-verify (must delete first due to FK constraint)
        const {
          error: deleteVerificationError
        } = await supabase.from('document_verifications').delete().eq('application_id', id);
        if (deleteVerificationError) {
          console.error('Error deleting old verifications:', deleteVerificationError);
          throw deleteVerificationError; // Throw error to prevent FK constraint violation
        }

        // Delete existing documents (after verifications are deleted)
        const {
          error: deleteDocsError
        } = await supabase.from('documents').delete().eq('application_id', id);
        if (deleteDocsError) {
          console.error('Error deleting old documents:', deleteDocsError);
          throw deleteDocsError;
        }

        // Determine document category based on application type
        const docCategory = application.jenis === 'mutasi_terpadu' ? 'mutasi_terpadu' : application.jenis === 'kenaikan_pangkat' ? 'kenaikan_pangkat' : application.jenis === 'pensiun' ? 'pensiun' : 'mutasi_terpadu';

        // Insert new documents
        const documentInserts = Object.entries(documents).filter(([key, link]) => link.trim() !== '').map(([key, link]) => {
          const index = parseInt(key.replace('doc_', ''));
          const documentName = documentRequirements[index];
          return {
            application_id: id,
            title: documentName,
            drive_link: link.trim(),
            created_by: user.id,
            document_category: docCategory,
            document_index: index
          };
        });
        if (documentInserts.length > 0) {
          const {
            error: documentsError
          } = await supabase.from('documents').insert(documentInserts);
          if (documentsError) throw documentsError;
        }
        console.log('Successfully resubmitted application for re-verification:', {
          applicationId: id,
          status: 'submitted',
          documentsCount: documentInserts.length
        });
        toast({
          title: "Berhasil",
          description: `Perbaikan usulan untuk ${application.employee_data.employee_name} berhasil dikirim ulang!`
        });
        setApplicationSubmitted(true);

        // Clear edit state
        setIsEditing(false);
        setDocumentVerificationStatus({});
        setFixedDocuments(new Set());
        setDocuments({});
        setAdditionalNotes('');

        // Navigate to appropriate list page based on application type
        setTimeout(() => {
          if (application.jenis === 'kenaikan_pangkat') {
            navigate('/apps/kenaikan-pangkat?tab=list');
          } else if (application.jenis === 'pensiun') {
            navigate('/apps/reminder-pensiun?tab=list');
          } else {
            navigate('/apps/pengajuan-mutasi-terpadu?tab=list');
          }
        }, 1000);
      } else {
        // Submit new application
        const {
          error
        } = await supabase.from('applications').update({
          status: 'submitted',
          tanggal_pengajuan: new Date().toISOString(),
          keterangan: `Kategori: Mutasi Terpadu${additionalNotes ? ` - ${additionalNotes}` : ''}`
        }).eq('id', application.id);
        if (error) throw error;

        // Determine document category based on application type
        const docCategory = application.jenis === 'mutasi_terpadu' ? 'mutasi_terpadu' : application.jenis === 'kenaikan_pangkat' ? 'kenaikan_pangkat' : application.jenis === 'pensiun' ? 'pensiun' : 'mutasi_terpadu';

        // Insert documents
        const documentInserts = Object.entries(documents).filter(([key, link]) => link.trim() !== '').map(([key, link]) => {
          const index = parseInt(key.replace('doc_', ''));
          const documentName = documentRequirements[index];
          return {
            application_id: id,
            title: documentName,
            drive_link: link.trim(),
            created_by: user.id,
            document_category: docCategory,
            document_index: index
          };
        });
        if (documentInserts.length > 0) {
          const {
            error: documentsError
          } = await supabase.from('documents').insert(documentInserts);
          if (documentsError) throw documentsError;
        }
        toast({
          title: "Berhasil",
          description: `Pengajuan untuk ${application.employee_data.employee_name} berhasil disubmit dan sedang menunggu verifikasi!`
        });
        setApplicationSubmitted(true);

        // Navigate to appropriate list page based on application type
        setTimeout(() => {
          if (application.jenis === 'kenaikan_pangkat') {
            navigate('/apps/kenaikan-pangkat?tab=list');
          } else if (application.jenis === 'pensiun') {
            navigate('/apps/reminder-pensiun?tab=list');
          } else {
            navigate('/apps/pengajuan-mutasi-terpadu?tab=list');
          }
        }, 1000);
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
      draft: {
        label: "Draft",
        className: "bg-gray-100 text-gray-700"
      },
      submitted: {
        label: "Menunggu Verifikasi",
        className: "bg-gray-100 text-gray-700"
      },
      in_review: {
        label: "Sudah Diperbaiki",
        className: "bg-orange-100 text-orange-700"
      },
      approved: {
        label: "Diproses",
        className: "bg-blue-100 text-blue-700"
      },
      rejected: {
        label: "Ditolak",
        className: "bg-red-100 text-red-700"
      },
      revision_needed: {
        label: "Perlu Perbaikan",
        className: "bg-yellow-100 text-yellow-700"
      }
    };
      const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };
  
  // Additional status badges for Biro OSDMA workflow
  const getBiroOsdmaStatusBadge = () => {
    if (!application) return null;
    
    if (application.status === 'biro_osdma_submitted' || application.biro_osdma_status === 'submitted') {
      return <Badge className="bg-purple-100 text-purple-700">Berkas di Ajukan ke Biro OSDMA</Badge>;
    }
    if (application.status === 'biro_osdma_review' || application.biro_osdma_status === 'in_progress') {
      return <Badge className="bg-indigo-100 text-indigo-700">Dalam Review Biro OSDMA</Badge>;
    }
    if (application.status === 'completed' || application.biro_osdma_status === 'approved') {
      return <Badge className="bg-green-100 text-green-700">Selesai - SK Terbit</Badge>;
    }
    
    return null;
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
  const allDocumentsCompleted = documentRequirements.every((_, index) => {
    const docKey = `doc_${index}`;
    return documents[docKey] && documents[docKey].trim() !== '';
  });

  // Check if all revision documents are completed (based on fixed status)
  const revisionDocumentsCompleted = application?.status === 'revision_needed' ? Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix').every(verification => {
    const docKey = Object.keys(documentVerificationStatus).find(key => documentVerificationStatus[key] === verification);
    return docKey && fixedDocuments.has(docKey);
  }) : false;

  // Draft button enabled when at least one document is saved
  const canSaveDraft = canEdit && savedDocuments.size > 0;

  // For revision mode: Submit button enabled when all documents that need fixing are marked as fixed
  // For new applications: Submit button enabled when all documents are saved
  const allDocumentsSaved = documentRequirements.every((_, index) => {
    const docKey = `doc_${index}`;
    return savedDocuments.has(docKey) && documents[docKey] && documents[docKey].trim() !== '';
  });
  const allRevisionDocumentsFixed = isEditing && application?.status === 'revision_needed' ? Object.entries(documentVerificationStatus).filter(([_, verification]) => verification.status === 'needs_fix').every(([docKey, _]) => fixedDocuments.has(docKey) && documents[docKey] && documents[docKey].trim() !== '') : false;
  const canSubmit = canEdit && (allRevisionDocumentsFixed || !isEditing && allDocumentsSaved || isEditing && application?.status !== 'revision_needed' && allDocumentsSaved);
  const progressPercentage = documentRequirements.length > 0 ? Math.round(submittedDocumentsCount / documentRequirements.length * 100) : 0;
  if (loading) {
    return <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Memuat data pengajuan...</p>
        </div>
      </div>;
  }
  if (!application) {
    return <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <p>Pengajuan tidak ditemukan</p>
          <Button onClick={() => navigate('/apps')} className="mt-4">
            Kembali ke Aplikasi
          </Button>
        </div>
      </div>;
  }
  const getApplicationTitle = () => {
    if (!application) return 'Detail Pengajuan';
    const titles: Record<string, string> = {
      'mutasi_terpadu': 'Detail Pengajuan Mutasi Terpadu',
      'kenaikan_pangkat': 'Detail Pengajuan Kenaikan Pangkat',
      'pensiun': 'Detail Pengajuan Pensiun'
    };
    return isEditing ? titles[application.jenis]?.replace('Detail', 'Edit') || 'Edit Pengajuan' : titles[application.jenis] || 'Detail Pengajuan';
  };
  const getBackUrl = () => {
    if (!application) return '/apps';
    const urls: Record<string, string> = {
      'mutasi_terpadu': '/apps/pengajuan-mutasi-terpadu?tab=list',
      'kenaikan_pangkat': '/apps/kenaikan-pangkat?tab=list',
      'pensiun': '/apps/reminder-pensiun?tab=list'
    };
    return urls[application.jenis] || '/apps';
  };
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(getBackUrl())}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {getApplicationTitle()}
          </h1>
          <p className="text-muted-foreground">
            {application.employee_data?.nomor_usulan || 'Nomor belum tersedia'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getBiroOsdmaStatusBadge() || getStatusBadge(application.status, application.keterangan)}
          {application.status === 'revision_needed' && !isEditing && <Button onClick={() => setIsEditing(true)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Edit Usulan
            </Button>}
          {canSaveDraft && <Button onClick={handleSaveDraft} disabled={isSubmitting || draftSaved} variant={draftSaved ? "default" : "outline"} className={draftSaved ? "bg-green-600 hover:bg-green-700 text-white" : ""}>
              {isSubmitting ? <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </> : draftSaved ? <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Draft Tersimpan
                </> : <>
                  <FileText className="w-4 h-4 mr-2" />
                  Simpan Draft ({savedDocuments.size}/{documentRequirements.length})
                </>}
            </Button>}
          {canSubmit && <Button onClick={() => setShowSubmitConfirmation(true)} disabled={isSubmitting || applicationSubmitted} className={applicationSubmitted ? "bg-green-600 hover:bg-green-700 text-white" : ""}>
              {isSubmitting ? <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Mengirim Perbaikan...' : 'Mengirim...'}
                </> : applicationSubmitted ? <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Pengajuan Terkirim
                </> : <>
                  <Send className="w-4 h-4 mr-2" />
                  {isEditing ? 'Submit Perbaikan' : 'Submit Pengajuan'}
                </>}
            </Button>}
        </div>
      </div>

      {/* Progress - Only show for draft and revision_needed status */}
      {(application.status === 'draft' || application.status === 'revision_needed') && <Card>
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
                  {application.status === 'revision_needed' ? 'Dokumen perbaikan yang sudah diupload' : 'Dokumen yang sudah diupload'}
                </span>
                <span>
                  {application.status === 'revision_needed' ? Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix' && documents[Object.keys(documentVerificationStatus).find(key => documentVerificationStatus[key] === v) || '']?.trim() !== '').length : submittedDocumentsCount} dari {application.status === 'revision_needed' ? Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix').length : documentRequirements.length}
                </span>
              </div>
              <Progress value={application.status === 'revision_needed' ? Math.round(Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix').filter(verification => {
            const docKey = Object.keys(documentVerificationStatus).find(key => documentVerificationStatus[key] === verification);
            return docKey && fixedDocuments.has(docKey);
          }).length / Math.max(Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix').length, 1) * 100) : progressPercentage} className={cn("w-full",
          // For revision status: green if all revision documents completed, gray if not
          application.status === 'revision_needed' ? revisionDocumentsCompleted ? "[&>div]:bg-green-500" : "[&>div]:bg-gray-400" : allDocumentsCompleted ? "[&>div]:bg-green-500" : "")} />
              {application.status === 'revision_needed' ? revisionDocumentsCompleted ? <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Dokumen perbaikan sudah lengkap
                  </p> : <p className="text-xs text-muted-foreground">
                    {Math.round(Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix').filter(verification => {
              const docKey = Object.keys(documentVerificationStatus).find(key => documentVerificationStatus[key] === verification);
              return docKey && fixedDocuments.has(docKey);
            }).length / Math.max(Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix').length, 1) * 100)}% perbaikan selesai
                  </p> : allDocumentsCompleted ? <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Dokumen persyaratan sudah lengkap
                  </p> : <p className="text-xs text-muted-foreground">
                    {progressPercentage}% selesai
                  </p>}
            </div>
          </CardContent>
        </Card>}

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
            {/* Horizontal scrollable timeline container */}
            <div className="overflow-x-auto pb-4">
              <div className="flex justify-between items-start gap-4 min-w-max px-4 py-8">
                {/* Calculate timeline steps and render - All steps always visible */}
                {(() => {
                  const createdAt = application?.created_at ? new Date(application.created_at) : null;
                  const submittedAt = application?.tanggal_pengajuan ? new Date(application.tanggal_pengajuan) : application?.updated_at ? new Date(application.updated_at) : null;
                  
                  // Get approved timestamp from workflows table
                  const getApprovedTimestamp = () => {
                    // First check if we have workflow data for approved status
                    const workflowData = Object.entries(workflowLinks).find(([key]) => key === 'approved');
                    if (workflowData && application?.status === 'approved') {
                      return application?.updated_at ? new Date(application.updated_at) : null;
                    }
                    // If status is approved or beyond, use updated_at
                    if (application?.status === 'approved' || application?.nota_dinas_uploaded_at || 
                        application?.status === 'biro_osdma_submitted' || application?.status === 'biro_osdma_review' || 
                        application?.status === 'completed') {
                      return application?.updated_at ? new Date(application.updated_at) : null;
                    }
                    return null;
                  };
                  
                  const approvedAt = getApprovedTimestamp();
                  const notaDinasUploadedAt = application?.nota_dinas_uploaded_at ? new Date(application.nota_dinas_uploaded_at) : null;
                  const biroDecisionAt = application?.biro_osdma_decision_at ? new Date(application.biro_osdma_decision_at) : null;
                  const skUploadedAt = application?.sk_uploaded_at ? new Date(application.sk_uploaded_at) : null;
                  
                  const isSubmitted = application?.status === 'submitted' || application?.status === 'approved' || application?.status === 'revision_needed' || application?.nota_dinas_uploaded_at;
                  const isApproved = application?.status === 'approved' || application?.nota_dinas_uploaded_at || 
                                     application?.status === 'biro_osdma_submitted' || application?.status === 'biro_osdma_review' || 
                                     application?.status === 'completed';

                  const calculateDuration = (start: Date | null, end: Date | null) => {
                    if (!start || !end) return null;
                    const diffMs = end.getTime() - start.getTime();
                    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    return days > 0 ? `${days} hari` : '< 1 hari';
                  };

                  const steps = [];

                  // Step 1: Pengajuan dibuat
                  const duration1 = calculateDuration(createdAt, submittedAt);
                  steps.push(
                    <div key="created" className="flex flex-col items-center relative flex-1 min-w-[180px]">
                      <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mb-3 z-10 relative">
                        <CheckCircle className="w-7 h-7 text-white" />
                      </div>
                      {/* Connector line to next step */}
                      {submittedAt !== null && (
                        <div className={`absolute left-[calc(50%+28px)] top-7 right-[-50%] h-0.5 ${submittedAt ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      )}
                      {submittedAt === null && (
                        <div className="absolute left-[calc(50%+28px)] top-7 right-[-50%] h-0.5 bg-gray-300"></div>
                      )}
                      
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Pengajuan Dibuat</h4>
                        {createdAt && (
                          <>
                            <p className="text-xs text-gray-600">
                              {createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </>
                        )}
                        {duration1 && (
                          <p className="text-xs text-green-600 font-medium mt-2">{duration1}</p>
                        )}
                      </div>
                    </div>
                  );

                  // Step 2: Data diajukan
                  const duration2 = calculateDuration(submittedAt, approvedAt);
                  steps.push(
                    <div key="submitted" className="flex flex-col items-center relative flex-1 min-w-[180px]">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 z-10 relative ${isSubmitted ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {isSubmitted ? <Send className="w-7 h-7 text-white" /> : <Clock className="w-7 h-7 text-gray-500" />}
                      </div>
                      {/* Connector line to next step */}
                      {approvedAt !== null && (
                        <div className={`absolute left-[calc(50%+28px)] top-7 right-[-50%] h-0.5 ${approvedAt ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      )}
                      {approvedAt === null && (
                        <div className="absolute left-[calc(50%+28px)] top-7 right-[-50%] h-0.5 bg-gray-300"></div>
                      )}
                      
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Data Diajukan</h4>
                        {submittedAt ? (
                          <>
                            <p className="text-xs text-gray-600">
                              {submittedAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {submittedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500">Belum diajukan</p>
                        )}
                        {duration2 && (
                          <p className="text-xs text-green-600 font-medium mt-2">{duration2}</p>
                        )}
                      </div>
                    </div>
                  );

                  // Step 3: Disetujui/Perlu Perbaikan
                  const duration3 = calculateDuration(approvedAt, notaDinasUploadedAt);
                  steps.push(
                    <div key="approved" className="flex flex-col items-center relative flex-1 min-w-[180px]">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 z-10 relative ${
                        isApproved ? 'bg-green-500' : 
                        application?.status === 'revision_needed' ? 'bg-yellow-500' : 
                        'bg-gray-300'
                      }`}>
                        {isApproved ? <CheckCircle className="w-7 h-7 text-white" /> : 
                         application?.status === 'revision_needed' ? <AlertTriangle className="w-7 h-7 text-white" /> : 
                         <Clock className="w-7 h-7 text-gray-500" />}
                      </div>
                      {/* Connector line to next step */}
                      {notaDinasUploadedAt !== null && (
                        <div className={`absolute left-[calc(50%+28px)] top-7 right-[-50%] h-0.5 ${notaDinasUploadedAt ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      )}
                      {notaDinasUploadedAt === null && (
                        <div className="absolute left-[calc(50%+28px)] top-7 right-[-50%] h-0.5 bg-gray-300"></div>
                      )}
                      
                      <div className="text-center">
                        {isApproved ? (
                          <>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Disetujui & Diproses</h4>
                            {approvedAt ? (
                              <>
                                <p className="text-xs text-gray-600">
                                  {approvedAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {approvedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </>
                            ) : (
                              <p className="text-xs text-gray-500">Waktu tidak tersedia</p>
                            )}
                          </>
                        ) : application?.status === 'revision_needed' ? (
                          <>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Perlu Perbaikan</h4>
                            <p className="text-xs text-gray-600">
                              {new Date(application?.updated_at || '').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </>
                        ) : (
                          <>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Menunggu Verifikasi</h4>
                            <p className="text-xs text-gray-500">Belum diproses</p>
                          </>
                        )}
                        {duration3 && (
                          <p className="text-xs text-green-600 font-medium mt-2">{duration3}</p>
                        )}
                      </div>
                    </div>
                  );

                  // Step 4: Berkas diajukan ke Biro OSDMA
                  const duration4 = calculateDuration(notaDinasUploadedAt, biroDecisionAt);
                  steps.push(
                    <div key="biro-submitted" className="flex flex-col items-center relative flex-1 min-w-[180px]">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 z-10 relative ${notaDinasUploadedAt ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {notaDinasUploadedAt ? <FileCheck className="w-7 h-7 text-white" /> : <Clock className="w-7 h-7 text-gray-500" />}
                      </div>
                      {/* Connector line to next step */}
                      {biroDecisionAt !== null && (
                        <div className={`absolute left-[calc(50%+28px)] top-7 right-[-50%] h-0.5 ${
                          application.biro_osdma_status === 'approved' ? 'bg-green-500' : 
                          application.biro_osdma_status === 'rejected' ? 'bg-red-500' : 
                          'bg-gray-300'
                        }`}></div>
                      )}
                      {biroDecisionAt === null && (
                        <div className="absolute left-[calc(50%+28px)] top-7 right-[-50%] h-0.5 bg-gray-300"></div>
                      )}
                      
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Berkas Diajukan ke Biro OSDMA</h4>
                        {notaDinasUploadedAt ? (
                          <>
                            <p className="text-xs text-gray-600">
                              {notaDinasUploadedAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {notaDinasUploadedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {workflowLinks['biro_osdma_submitted'] && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2 h-7 text-xs"
                                onClick={() => window.open(workflowLinks['biro_osdma_submitted'], '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Lihat Bukti
                              </Button>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-500">Belum diajukan</p>
                        )}
                        {duration4 && (
                          <p className={`text-xs font-medium mt-2 ${
                            application.biro_osdma_status === 'approved' ? 'text-green-600' : 
                            application.biro_osdma_status === 'rejected' ? 'text-red-600' : 
                            'text-gray-500'
                          }`}>{duration4}</p>
                        )}
                      </div>
                    </div>
                  );

                  // Step 5: Status Biro OSDMA
                  const duration5 = calculateDuration(biroDecisionAt, skUploadedAt);
                  const isBiroReview = application.status === 'biro_osdma_review';
                  steps.push(
                    <div key="biro-decision" className="flex flex-col items-center relative flex-1 min-w-[180px]">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 z-10 relative ${
                        application.biro_osdma_status === 'approved' ? 'bg-green-500' : 
                        application.biro_osdma_status === 'rejected' ? 'bg-red-500' : 
                        isBiroReview ? 'bg-green-500' :
                        'bg-gray-300'
                      }`}>
                        {application.biro_osdma_status === 'approved' ? <CheckCircle className="w-7 h-7 text-white" /> : 
                         application.biro_osdma_status === 'rejected' ? <XCircle className="w-7 h-7 text-white" /> : 
                         <Clock className="w-7 h-7 text-gray-500" />}
                      </div>
                      {/* Connector line to next step */}
                      {skUploadedAt !== null && (
                        <div className={`absolute left-[calc(50%+28px)] top-7 right-[-50%] h-0.5 ${skUploadedAt ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      )}
                      {skUploadedAt === null && (
                        <div className="absolute left-[calc(50%+28px)] top-7 right-[-50%] h-0.5 bg-gray-300"></div>
                      )}
                      
                      <div className="text-center">
                        {application.biro_osdma_status === 'approved' ? (
                          <>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Pengajuan Disetujui</h4>
                            <p className="text-xs text-green-700 mb-1">Menunggu penerbitan SK</p>
                            {biroDecisionAt && (
                              <>
                                <p className="text-xs text-gray-600">
                                  {biroDecisionAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {biroDecisionAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </>
                            )}
                            {workflowLinks['biro_osdma_review'] && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2 h-7 text-xs"
                                onClick={() => window.open(workflowLinks['biro_osdma_review'], '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Lihat Bukti
                              </Button>
                            )}
                          </>
                        ) : application.biro_osdma_status === 'rejected' ? (
                          <>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Pengajuan Ditolak</h4>
                            {biroDecisionAt && (
                              <>
                                <p className="text-xs text-gray-600">
                                  {biroDecisionAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {biroDecisionAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </>
                            )}
                            {application.biro_osdma_rejection_notes && (
                              <p className="text-xs text-red-700 mt-2 bg-red-50 p-2 rounded">
                                {application.biro_osdma_rejection_notes}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Menunggu Keputusan</h4>
                            {workflowData['biro_osdma_review']?.created_at && (
                              <>
                                <p className="text-xs text-gray-600">
                                  {new Date(workflowData['biro_osdma_review'].created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(workflowData['biro_osdma_review'].created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </>
                            )}
                            {workflowData['biro_osdma_review']?.note && (
                              <p className="text-xs text-blue-700 mt-2 bg-blue-50 p-2 rounded">
                                {workflowData['biro_osdma_review'].note}
                              </p>
                            )}
                            {!workflowData['biro_osdma_review']?.created_at && (
                              <p className="text-xs text-gray-500">Dalam proses review</p>
                            )}
                          </>
                        )}
                        {duration5 && (
                          <p className="text-xs text-green-600 font-medium mt-2">{duration5}</p>
                        )}
                      </div>
                    </div>
                  );

                  // Step 6: SK Terbit (no connecting line after this)
                  steps.push(
                    <div key="sk-published" className="flex flex-col items-center relative flex-1 min-w-[180px]">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 z-10 relative ${skUploadedAt ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {skUploadedAt ? <CheckCircle className="w-7 h-7 text-white" /> : <Clock className="w-7 h-7 text-gray-500" />}
                      </div>
                      
                      <div className="text-center">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">SK Telah Terbit</h4>
                        {skUploadedAt ? (
                          <>
                            <p className="text-xs text-gray-600">
                              {skUploadedAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {skUploadedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {application.sk_url && (
                              <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => window.open(application.sk_url!, '_blank')}>
                                <Eye className="w-3 h-3 mr-1" />
                                Lihat SK
                              </Button>
                            )}
                            {workflowLinks['completed'] && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2 h-7 text-xs ml-1"
                                onClick={() => window.open(workflowLinks['completed'], '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Lihat Bukti
                              </Button>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-500">Belum terbit</p>
                        )}
                      </div>
                    </div>
                  );

                  return steps;
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Verification Status - Moved from bottom */}
      {application.status !== 'draft' && <DocumentVerificationStatus applicationId={application.id} applicationStatus={application.status} />}

      {/* Edit Mode Summary */}
      {isEditing && Object.keys(documentVerificationStatus).length > 0 && <Card className="bg-orange-50 border-orange-200">
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
            {Object.values(documentVerificationStatus).some(v => v.status === 'needs_fix') && <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm font-medium text-red-900">
                  Fokus pada dokumen yang perlu diperbaiki. Pastikan untuk menekan tombol "Perbaiki" setelah mengupdate link dokumen.
                </p>
              </div>}
          </CardContent>
        </Card>}

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
            {application.employee_data && <>
                <div>
                  <Label className="text-sm font-medium">Pegawai yang Diusulkan</Label>
                  <p className="mt-1 font-medium">{application.employee_data.employee_name}</p>
                  <p className="text-sm text-muted-foreground">
                    NIP: {application.employee_data.employee_nip}
                  </p>
                </div>

                <Separator />

                

                <div>
                  <Label className="text-sm font-medium">Unit Kerja Tujuan</Label>
                  <p className="mt-1 font-medium text-primary">{application.employee_data.unit_tujuan}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Jabatan Tujuan</Label>
                  <p className="mt-1 font-medium">{application.employee_data.jabatan_tujuan}</p>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Alasan Pengajuan</Label>
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

                {/* Workflow Supporting Documents */}
                {(application.status === 'approved' || 
                  application.status === 'biro_osdma_submitted' || 
                  application.status === 'biro_osdma_review' || 
                  application.status === 'completed') && (
                  <>
                    <Separator />
                    
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Bukti Dukung Proses</Label>
                      <div className="space-y-2">
                        {/* Bukti Disetujui */}
                        {(application.status === 'approved' || 
                          application.status === 'biro_osdma_submitted' || 
                          application.status === 'biro_osdma_review' || 
                          application.status === 'completed') && workflowLinks['approved'] && (
                          <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                            <span className="text-sm text-green-800">Bukti Usulan Disetujui</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(workflowLinks['approved'], '_blank')}
                              className="h-8 gap-2 border-green-300 hover:bg-green-100"
                            >
                              <Eye className="w-3 h-3" />
                              Lihat
                            </Button>
                          </div>
                        )}

                        {/* Bukti Berkas Diajukan ke Biro OSDMA */}
                        {(application.status === 'biro_osdma_submitted' || 
                          application.status === 'biro_osdma_review' || 
                          application.status === 'completed') && workflowLinks['biro_osdma_submitted'] && (
                          <div className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded-lg">
                            <span className="text-sm text-purple-800">Bukti Pengajuan ke Biro OSDMA</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(workflowLinks['biro_osdma_submitted'], '_blank')}
                              className="h-8 gap-2 border-purple-300 hover:bg-purple-100"
                            >
                              <Eye className="w-3 h-3" />
                              Lihat
                            </Button>
                          </div>
                        )}

                        {/* Bukti Review Biro OSDMA */}
                        {(application.status === 'biro_osdma_review' || 
                          application.status === 'completed') && workflowLinks['biro_osdma_review'] && (
                          <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <span className="text-sm text-indigo-800">Bukti Review Biro OSDMA</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(workflowLinks['biro_osdma_review'], '_blank')}
                              className="h-8 gap-2 border-indigo-300 hover:bg-indigo-100"
                            >
                              <Eye className="w-3 h-3" />
                              Lihat
                            </Button>
                          </div>
                        )}

                        {/* Bukti SK Terbit */}
                        {application.status === 'completed' && workflowLinks['completed'] && (
                          <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                            <span className="text-sm text-green-800">Bukti SK Telah Terbit</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(workflowLinks['completed'], '_blank')}
                              className="h-8 gap-2 border-green-300 hover:bg-green-100"
                            >
                              <Eye className="w-3 h-3" />
                              Lihat
                            </Button>
                          </div>
                        )}

                        {/* Show message if no workflow links available yet */}
                        {!workflowLinks['approved'] && 
                         !workflowLinks['biro_osdma_submitted'] && 
                         !workflowLinks['biro_osdma_review'] && 
                         !workflowLinks['completed'] && (
                          <p className="text-sm text-muted-foreground italic">
                            Belum ada bukti dukung yang diupload
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>}
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
            {isEditing && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 mb-2">Panduan Edit Dokumen</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <span className="font-medium text-green-700">✓ Disetujui</span>: Dokumen sudah benar, tidak perlu diubah</p>
                  <p>• <span className="font-medium text-red-700">✗ Perlu Diperbaiki</span>: Dokumen harus diperbaiki dan diupload ulang</p>
                  <p>• <span className="font-medium text-yellow-700">⏳ Menunggu</span>: Dokumen belum diperiksa</p>
                </div>
              </div>}

            <div className="space-y-4">
              {documentRequirements.map((requirement, index) => {
              const docKey = `doc_${index}`;
              const verificationStatus = documentVerificationStatus[docKey];
              const needsAttention = isEditing && verificationStatus?.status === 'needs_fix';
              const isApproved = verificationStatus?.status === 'approved';
              const isFixed = fixedDocuments.has(docKey);
              const documentLink = documents[docKey];

              // View mode - show only eye icon for viewing saved documents
              if (!canEdit && documentLink) {
                const statusColor = isApproved ? 'green' : 'blue';
                return <div key={index} className={`space-y-2 bg-${statusColor}-50 border border-${statusColor}-200 rounded-lg p-3`}>
                      <div className="flex items-center justify-between">
                        <Label className={`text-sm font-medium text-${statusColor}-800`}>
                          {index + 1}. {requirement}
                        </Label>
                        {verificationStatus && getVerificationStatusBadge(verificationStatus.status)}
                      </div>
                      {isApproved && <p className="text-xs text-green-700 mb-2">Dokumen telah disetujui</p>}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(documentLink, '_blank')}
                        className={`w-full border-${statusColor}-300 hover:bg-${statusColor}-100`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Lihat Dokumen
                      </Button>
                    </div>;
              }

              // View mode - show placeholder for documents not yet uploaded
              if (!canEdit && !documentLink) {
                return <div key={index} className="space-y-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-600">
                          {index + 1}. {requirement}
                        </Label>
                        <Badge className="bg-gray-100 text-gray-600">Belum diupload</Badge>
                      </div>
                    </div>;
              }

              // In edit mode, only show documents that need fixing or are new
              if (isEditing && isApproved) {
                return <div key={index} className="space-y-2 bg-green-50 border border-green-200 rounded-lg p-3 opacity-75">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-green-800">
                          {index + 1}. {requirement}
                        </Label>
                        {getVerificationStatusBadge(verificationStatus.status)}
                      </div>
                      <p className="text-xs text-green-700">Dokumen sudah disetujui, tidak perlu diubah</p>
                    </div>;
              }
              
              return <div key={index} className={`space-y-2 ${needsAttention ? 'bg-red-50 border border-red-200 rounded-lg p-3' : ''} ${isFixed ? 'bg-blue-50 border border-blue-200' : ''}`}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`doc-${index}`} className={`text-sm font-medium ${needsAttention ? 'text-red-800' : isFixed ? 'text-blue-800' : ''}`}>
                        {index + 1}. {requirement}
                      </Label>
                      <div className="flex items-center gap-2">
                        {verificationStatus && getVerificationStatusBadge(verificationStatus.status)}
                        {isFixed && <Badge className="bg-blue-100 text-blue-700">✓ Diperbaiki</Badge>}
                      </div>
                    </div>
                    
                    {verificationStatus?.admin_notes && <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                        <p className="text-xs font-medium text-yellow-800">Catatan Admin:</p>
                        <p className="text-xs text-yellow-700">{verificationStatus.admin_notes}</p>
                      </div>}
                    
                     <div className="flex gap-2">
                       <Input id={`doc-${index}`} placeholder="Masukkan link Google Drive dokumen..." value={documents[docKey] || ""} onChange={e => handleDocumentChange(index, e.target.value)} className={needsAttention ? 'border-red-300 focus:border-red-500' : isFixed ? 'border-green-300 focus:border-green-500 bg-green-50' : savedDocuments.has(docKey) ? 'border-green-300 focus:border-green-500 bg-green-50' : ''} disabled={!canEdit || isFixed || savedDocuments.has(docKey)} />
                       {/* Revision flow buttons */}
                       {needsAttention && !isFixed && documents[docKey] && <Button onClick={() => handleMarkDocumentFixed(docKey)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
                           Perbaiki
                         </Button>}
                       {needsAttention && isFixed && <Button onClick={() => handleUnmarkDocumentFixed(docKey)} size="sm" variant="outline" className="whitespace-nowrap">
                           Edit
                         </Button>}
                       {/* Regular save/edit buttons */}
                       {!needsAttention && !savedDocuments.has(docKey) && documents[docKey] && documents[docKey].trim() !== '' && <Button onClick={() => handleSaveDocument(docKey)} size="sm" className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap">
                           Simpan
                         </Button>}
                       {!needsAttention && savedDocuments.has(docKey) && <Button onClick={() => handleEditDocument(docKey)} size="sm" variant="outline" className="whitespace-nowrap">
                           Edit
                         </Button>}
                       {documents[docKey] && <Button variant="outline" size="sm" onClick={() => window.open(documents[docKey], '_blank')}>
                           <Eye className="w-4 h-4" />
                         </Button>}
                     </div>
                     
                     {isFixed && <div className="bg-blue-50 border border-blue-200 rounded p-2">
                         <p className="text-xs font-medium text-blue-800">✓ Dokumen telah diperbaiki</p>
                         <p className="text-xs text-blue-700">Dokumen ini telah ditandai sebagai diperbaiki dan siap untuk direview ulang.</p>
                       </div>}
                     
                     {!needsAttention && savedDocuments.has(docKey) && <div className="bg-green-50 border border-green-200 rounded p-2">
                         <p className="text-xs font-medium text-green-800">✓ Dokumen telah disimpan</p>
                         <p className="text-xs text-green-700">Link dokumen telah disimpan dan dikunci dari perubahan.</p>
                       </div>}
                   </div>;
            })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Notes */}
      {canEdit && <Card>
          <CardHeader>
            <CardTitle>Catatan Tambahan</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea placeholder="Masukkan catatan atau keterangan tambahan jika diperlukan..." value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} rows={4} />
          </CardContent>
        </Card>}

      {/* Information Card */}
      {canEdit && <Card className="bg-amber-50 border-amber-200">
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
        </Card>}

      {/* Bottom Submit Button */}
      {canEdit && (
        <Card className="sticky bottom-4 z-10 shadow-lg border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {application.status === 'revision_needed' 
                    ? `Dokumen perbaikan: ${Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix' && documents[Object.keys(documentVerificationStatus).find(key => documentVerificationStatus[key] === v) || '']?.trim() !== '').length}/${Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix').length} selesai`
                    : `Dokumen diupload: ${submittedDocumentsCount}/${documentRequirements.length}`}
                </p>
                <Progress 
                  value={application.status === 'revision_needed'
                    ? Math.round((Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix').filter(verification => {
                        const docKey = Object.keys(documentVerificationStatus).find(key => documentVerificationStatus[key] === verification);
                        return docKey && fixedDocuments.has(docKey);
                      }).length / Math.max(Object.values(documentVerificationStatus).filter(v => v.status === 'needs_fix').length, 1)) * 100)
                    : progressPercentage}
                  className="h-2 mt-2"
                />
              </div>
              <div className="flex items-center gap-2">
                {canSaveDraft && (
                  <Button
                    onClick={handleSaveDraft}
                    disabled={isSubmitting || draftSaved}
                    variant={draftSaved ? "default" : "outline"}
                    className={draftSaved ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : draftSaved ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Draft Tersimpan
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Simpan Draft
                      </>
                    )}
                  </Button>
                )}
                {canSubmit && (
                  <Button
                    onClick={() => setShowSubmitConfirmation(true)}
                    disabled={isSubmitting || applicationSubmitted}
                    className={applicationSubmitted ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isEditing ? 'Mengirim Perbaikan...' : 'Mengirim...'}
                      </>
                    ) : applicationSubmitted ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Pengajuan Terkirim
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
          </CardContent>
        </Card>
      )}

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirmation} onOpenChange={setShowSubmitConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Submit Pengajuan</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Apakah anda sudah yakin untuk submit pengajuan?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitConfirmation(false)}>
              Tidak
            </Button>
            <Button onClick={handleSubmitApplication} disabled={isSubmitting}>
              {isSubmitting ? <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengirim...
                </> : 'Ya'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Nota Dinas Dialog */}
      <Dialog open={showUploadNotaDinasDialog} onOpenChange={setShowUploadNotaDinasDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Nota Dinas Pengajuan ke Biro OSDMA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Link Nota Dinas</Label>
              <Input
                placeholder="Masukkan link Google Drive untuk Nota Dinas..."
                value={notaDinasUrl}
                onChange={(e) => setNotaDinasUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadNotaDinasDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleUploadNotaDinas} disabled={!notaDinasUrl.trim()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Biro OSDMA Status Dialog */}
      <Dialog open={showUpdateBiroStatusDialog} onOpenChange={setShowUpdateBiroStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status Biro OSDMA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={biroStatus} onValueChange={(value: 'in_progress' | 'approved' | 'rejected') => setBiroStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">Dalam Proses</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {biroStatus === 'rejected' && (
              <div>
                <Label>Keterangan Penolakan</Label>
                <Textarea
                  placeholder="Masukkan alasan penolakan..."
                  value={biroRejectionNotes}
                  onChange={(e) => setBiroRejectionNotes(e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateBiroStatusDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateBiroStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload SK Dialog */}
      <Dialog open={showUploadSKDialog} onOpenChange={setShowUploadSKDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload SK (Surat Keputusan)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Link SK</Label>
              <Input
                placeholder="Masukkan link Google Drive untuk SK..."
                value={skUrl}
                onChange={(e) => setSkUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadSKDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleUploadSK} disabled={!skUrl.trim()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}