import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  FileText,
  User,
  TrendingUp,
  Check,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";

const PENSIUN_DOCUMENT_REQUIREMENTS = [
  "Surat Permohonan Pensiun dari Ybs",
  "Foto Pegawai",
  "KTP",
  "NPWP",
  "Daftar Susunan Keluarga",
  "Kartu Pegawai",
  "Surat Nikah",
  "Akte Kelahiran Anak (apabila masih ada anak yang menjadi tanggungan)",
  "SK CPNS",
  "SK PNS",
  "SK Kenaikan Pangkat Terakhir",
  "SK Jabatan Terakhir",
  "Kenaikan Gaji Berkala Terakhir",
  "SKP 2 Tahun Terakhir",
  "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat (dalam 1 tahun terakhir)",
  "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana",
  "Data Perorangan Calon Penerimaan Pensiun (DPCPP)",
  "Buku Tabungan (lembar yang terdapat nomor rekening)",
  "Karis/Karsu",
  "Surat Keterangan Kematian (bila ada)",
  "Surat Keterangan Anak masih sekolah/kuliah (bila terdapat anak yang masih menjadi tanggungan)"
];

const retirementCategories: { [key: string]: { label: string, documents: string[] } } = {
  "pensiun_reguler": {
    label: "Pensiun Reguler",
    documents: PENSIUN_DOCUMENT_REQUIREMENTS
  },
  "pensiun_janda_duda": {
    label: "Pensiun Janda/Duda (PNS Meninggal)",
    documents: [
      "Surat Permohonan Pensiun dari Janda/Duda Ybs",
      "Foto Janda/Duda Ybs",
      "KTP Janda/Duda",
      "NPWP Janda/Duda",
      "Daftar Susunan Keluarga",
      "Kartu Pegawai",
      "Surat Nikah",
      "Akte Kelahiran Anak (apabila masih ada anak yang menjadi tanggungan)",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "SK Jabatan Terakhir",
      "Kenaikan Gaji Berkala Terakhir",
      "SKP 2 Tahun Terakhir",
      "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat (dalam 1 tahun terakhir)",
      "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana",
      "Data perorangan Calon Penerimaan Pensiun (DPCPP)",
      "Buku Tabungan Janda/Duda (lembar yang terdapat nomor rekening)",
      "Surat Keterangan Kematian Ybs",
      "Surat Keterangan Janda/Duda dari Kelurahan",
      "Karis/Karsu",
      "Surat Keterangan Anak masih sekolah/kuliah (bila terdapat anak yang masih menjadi tanggungan)"
    ]
  },
  "pensiun_anak": {
    label: "Pensiun Anak (PNS dan pasangan meninggal dunia, anak berusia dibawah 25 tahun dan belum berumah tangga)",
    documents: [
      "Surat Permohonan Pensiun dari Anak Ybs",
      "Foto Anak Ybs",
      "KTP Anak",
      "Daftar Susunan Keluarga",
      "Kartu Pegawai",
      "Akte Kelahiran Anak",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "Kenaikan Gaji Berkala Terakhir",
      "SKP 2 Tahun Terakhir",
      "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat (dalam 1 tahun terakhir)",
      "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana",
      "Data perorangan Calon Penerimaan Pensiun (DPCPP)",
      "Buku Tabungan Anak (lembar yang terdapat nomor rekening)",
      "Surat Keterangan Kematian Ybs",
      "Surat Keterangan Kematian Pasangan YBS"
    ]
  },
  "pensiun_tanpa_ahli_waris": {
    label: "PNS Meninggal Tanpa Ahli Waris",
    documents: [
      "Surat Kematian",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "SK Jabatan Terakhir"
    ]
  },
  "pensiun_belum_menikah": {
    label: "PNS Meninggal Status Belum Menikah",
    documents: [
      "Surat Permohonan Pensiun dari Ortu Ybs",
      "Foto Ortu Ybs",
      "KTP Ortu Ybs",
      "Daftar Susunan Keluarga",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "SK Jabatan Terakhir",
      "Data perorangan Calon Penerimaan Pensiun (DPCPP)",
      "Buku Tabungan Ortu (lembar yang terdapat nomor rekening)",
      "Surat Keterangan Kematian Ybs"
    ]
  },
  "pensiun_dini": {
    label: "Pensiun Dini (usia berusia min 45 Tahun dan masa kerja 20 Tahun)",
    documents: [
      "Surat Permohonan Pensiun dari Ybs",
      "Foto Pegawai",
      "KTP",
      "NPWP",
      "Daftar Susunan Keluarga",
      "Kartu Pegawai",
      "Surat Nikah (bila ada)",
      "Akte Kelahiran Anak (apabila masih ada anak yang menjadi tanggungan)",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "SK Jabatan Terakhir",
      "Kenaikan Gaji Berkala Terakhir",
      "SKP 2 Tahun Terakhir",
      "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat (dalam 1 tahun terakhir)",
      "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana",
      "Data perorangan Calon Penerimaan Pensiun (DPCPP)"
    ]
  },
  "pensiun_anumerta": {
    label: "Pensiun Anumerta",
    documents: [
      "Berita Acara (kejadian yang mengakibatkan ybs meninggal dunia)",
      "Visum et repertum",
      "Surat Tugas Ybs",
      "Surat Keterangan (yang menyatakan ybs meninggal karena dinas)",
      "Laporan Dari Pimpinan Unit Kerja (yang menyatakan bahwa ybs meninggal karna dinas)",
      "Kenaikan Pangkat Anumerta Sementara",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "SK Jabatan Terakhir",
      "Kenaikan Gaji Berkala Terakhir",
      "Surat Nikah (bila ada)",
      "Akte Kelahiran Anak (apabila masih ada anak yang menjadi tanggungan)",
      "Foto Janda/Duda Ybs",
      "Buku Tabungan Janda/Duda (lembar yang terdapat nomor rekening)",
      "Surat Keterangan Kematian Ybs",
      "Karis/Karsu",
      "Surat Keterangan Anak masih sekolah/kuliah (bila terdapat anak yang masih menjadi tanggungan)"
    ]
  },
  "masa_pra_pensiun": {
    label: "Masa Pra Pensiun (pengajuan minimal 1 thn s.d 3 bulan sebelum TMT Pensiun)",
    documents: [
      "Surat Permohonan Pensiun dari Ybs",
      "Foto Pegawai",
      "KTP",
      "NPWP",
      "Daftar Susunan Keluarga",
      "Kartu Pegawai",
      "Surat Nikah",
      "Akte Kelahiran Anak (apabila masih ada anak yang menjadi tanggungan)",
      "SK CPNS",
      "SK PNS",
      "SK Kenaikan Pangkat Terakhir",
      "SK Jabatan Terakhir",
      "Kenaikan Gaji Berkala Terakhir",
      "SKP 2 Tahun Terakhir",
      "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat (dalam 1 tahun terakhir)",
      "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana"
    ]
  }
};

export default function EditPerbaikanPensiun() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<{ [key: string]: string }>({});
  const [savedDocuments, setSavedDocuments] = useState<Set<string>>(new Set());
  const [fixedDocuments, setFixedDocuments] = useState<Set<string>>(new Set());
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [documentVerificationStatus, setDocumentVerificationStatus] = useState<{ [key: string]: any }>({});

  // Get documents for selected category - only if application is loaded
  const getCategoryDocuments = () => {
    console.log('Getting category documents for application:', {
      hasApplication: !!application,
      applicationId: application?.id,
      applicationStatus: application?.status,
      applicationEstimasi: application?.estimasi
    });

    if (!application || !application.estimasi) {
      console.log('Application or estimasi not loaded yet, using default documents');
      return PENSIUN_DOCUMENT_REQUIREMENTS;
    }

    try {
      const estimasiData = JSON.parse(application.estimasi || '{}');
      const kategori = estimasiData.kategori;

      console.log('Parsed category data:', {
        estimasiData,
        kategori,
        kategoriType: typeof kategori,
        hasKategori: !!kategori
      });

      if (!kategori || !retirementCategories[kategori as keyof typeof retirementCategories]) {
        console.log('Category not found or invalid, using default documents');
        return PENSIUN_DOCUMENT_REQUIREMENTS;
      }

      const categoryDocs = retirementCategories[kategori as keyof typeof retirementCategories].documents;
      console.log('Found category documents:', {
        category: kategori,
        documentCount: categoryDocs.length,
        firstFewDocuments: categoryDocs.slice(0, 3)
      });

      return categoryDocs;
    } catch (parseError) {
      console.error('Error parsing estimasi data:', parseError);
      return PENSIUN_DOCUMENT_REQUIREMENTS;
    }
  };

  const categoryDocuments = getCategoryDocuments();

  useEffect(() => {
    console.log('EditPerbaikanPensiun useEffect triggered:', {
      id,
      idType: typeof id,
      idLength: id?.length,
      hasId: !!id
    });

    if (id && id.trim() !== '') {
      console.log('Loading application for revision:', { applicationId: id });
      loadApplicationData();
    } else {
      console.error('No valid application ID provided:', { id });
      toast({
        title: "Error",
        description: "ID aplikasi tidak valid atau tidak ditemukan",
        variant: "destructive"
      });
      navigate('/apps/pensiun');
    }
  }, [id]);

  const loadApplicationData = async () => {
    try {
      setLoading(true);
      console.log('Starting to load application data for ID:', id);

      // Load application data
      const { data: app, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .single();

      console.log('Database query result:', {
        hasData: !!app,
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message,
        applicationId: id
      });

      if (error) {
        console.error('Database error details:', {
          error,
          applicationId: id,
          errorCode: error.code,
          errorMessage: error.message
        });

        if (error.code === 'PGRST116') {
          toast({
            title: "Error",
            description: `Aplikasi dengan ID ${id.slice(0, 8)}... tidak ditemukan di database`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: `Gagal memuat aplikasi: ${error.message}`,
            variant: "destructive"
          });
        }
        throw error;
      }

      if (!app) {
        console.error('Application not found:', { applicationId: id });
        toast({
          title: "Error",
          description: "Aplikasi tidak ditemukan",
          variant: "destructive"
        });
        throw new Error('Application not found');
      }

      if (app.status !== 'revision_needed') {
        console.log('Application status:', app.status);
        console.log('Expected status: revision_needed');
        toast({
          title: "Error",
          description: `Aplikasi ini tidak dalam status perlu perbaikan. Status saat ini: ${app.status}`,
          variant: "destructive"
        });
        navigate('/apps/pensiun');
        return;
      }

      setApplication(app);

      // Load existing documents
      const { data: documentsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('application_id', id)
        .order('document_index');

      if (docsError) throw docsError;

      const loadedDocuments: { [key: string]: string } = {};
      documentsData?.forEach(doc => {
        if (doc.document_index !== null && doc.drive_link) {
          loadedDocuments[`doc_${doc.document_index}`] = doc.drive_link;
        }
      });
      setDocuments(loadedDocuments);

      // Mark all loaded documents as saved
      Object.keys(loadedDocuments).forEach(docKey => {
        setSavedDocuments(prev => new Set(prev).add(docKey));
      });

      // Load document verification status
      const { data: verifications, error: verifError } = await supabase
        .from('document_verifications')
        .select('*')
        .eq('application_id', id);

      if (verifError) throw verifError;

      const verificationStatus: { [key: string]: any } = {};
      verifications?.forEach(verification => {
        // Map document_type to the correct format (e.g., "doc_0", "doc_1", etc.)
        const docIndex = verification.document_type.replace('doc_', '');
        const docKey = `doc_${docIndex}`;
        verificationStatus[docKey] = verification;
      });
      setDocumentVerificationStatus(verificationStatus);

      // Ensure all category documents have verification records with correct status
      await ensureAllDocumentVerifications(categoryDocuments, id, user?.id);

      // For revision_needed applications, mark all documents as needs_fix by default
      // unless they are already marked as fixed by the user
      console.log('Setting default status for revision_needed application');
      await setDefaultVerificationStatus(categoryDocuments, id);

      toast({
        title: "Data Dimuat",
        description: "Data perbaikan berhasil dimuat"
      });
    } catch (error) {
      console.error('Error loading application data for revision:', error);
      console.error('Error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        applicationId: id
      });

      toast({
        title: "Error",
        description: "Gagal memuat data perbaikan",
        variant: "destructive"
      });
      navigate('/apps/pensiun');
    } finally {
      setLoading(false);
    }
  };

  const setDefaultVerificationStatus = async (documents: string[], applicationId: string) => {
    try {
      // Check if there are any existing verifications first
      const { data: existingVerifications, error: checkError } = await supabase
        .from('document_verifications')
        .select('id')
        .eq('application_id', applicationId);

      if (checkError) {
        console.error('Error checking existing verifications:', checkError);
        return;
      }

      // If no verifications exist, we can't create or update them due to RLS
      if (!existingVerifications || existingVerifications.length === 0) {
        console.log('No verifications exist - cannot update due to RLS policy');
        return;
      }

      // Update all document verifications to 'needs_fix' status if they're not already approved
      const { error: updateError } = await supabase
        .from('document_verifications')
        .update({
          status: 'needs_fix',
          admin_notes: 'Dokumen perlu diperbaiki',
          verified_at: null,
          verified_by: null
        })
        .eq('application_id', applicationId)
        .neq('status', 'approved');

      if (updateError) {
        console.error('Error setting default verification status:', updateError);
        return;
      }

      console.log('Successfully set default verification status for all documents');

      // Reload verification status
      const { data: updatedVerifications, error: reloadError } = await supabase
        .from('document_verifications')
        .select('*')
        .eq('application_id', applicationId);

      if (reloadError) {
        console.error('Error reloading verification status:', reloadError);
        return;
      }

      const updatedVerificationStatus: { [key: string]: any } = {};
      updatedVerifications?.forEach(verification => {
        const docIndex = verification.document_type.replace('doc_', '');
        const docKey = `doc_${docIndex}`;
        updatedVerificationStatus[docKey] = verification;
      });
      setDocumentVerificationStatus(updatedVerificationStatus);

      console.log('Reloaded verification status after setting defaults');
    } catch (error) {
      console.error('Error in setDefaultVerificationStatus:', error);
    }
  };

  const ensureAllDocumentVerifications = async (documents: string[], applicationId: string, userId?: string) => {
    try {
      // For revision_needed applications, we need to work with existing verifications
      // Don't try to create new ones as it violates RLS policy
      console.log('Checking existing document verifications for application:', applicationId);

      // Get existing verifications
      const { data: existingVerifications, error: fetchError } = await supabase
        .from('document_verifications')
        .select('*')
        .eq('application_id', applicationId);

      if (fetchError) {
        console.error('Error fetching existing verifications:', fetchError);
        return;
      }

      console.log('Found existing verifications:', existingVerifications?.length || 0);

      // If no verifications exist, we can't create them due to RLS
      // Just log and continue - the documents will be handled by the UI
      if (!existingVerifications || existingVerifications.length === 0) {
        console.log('No existing verifications found - RLS prevents creation');
        return;
      }

      const existingDocTypes = new Set(existingVerifications.map(v => v.document_type));

      // For missing document types, we need to handle them differently
      // since we can't insert due to RLS policy
      const missingDocTypes = documents
        .map((_, index) => `doc_${index}`)
        .filter(docType => !existingDocTypes.has(docType));

      if (missingDocTypes.length > 0) {
        console.log('Missing document types (cannot create due to RLS):', missingDocTypes);
        // For now, we'll work with existing verifications only
        // In a real scenario, these would be created by an admin or through a different mechanism
      }

      // Update existing verifications to ensure they have correct status for revision
      const { error: updateError } = await supabase
        .from('document_verifications')
        .update({
          status: 'needs_fix',
          admin_notes: 'Dokumen perlu diperbaikan',
          verified_at: null,
          verified_by: null
        })
        .eq('application_id', applicationId)
        .neq('status', 'approved');

      if (updateError) {
        console.error('Error updating verification status:', updateError);
        return;
      }

      console.log('Successfully updated existing verification status');

      // Reload verification status
      const { data: updatedVerifications, error: reloadError } = await supabase
        .from('document_verifications')
        .select('*')
        .eq('application_id', applicationId);

      if (reloadError) {
        console.error('Error reloading verification status:', reloadError);
        return;
      }

      const updatedVerificationStatus: { [key: string]: any } = {};
      updatedVerifications?.forEach(verification => {
        const docIndex = verification.document_type.replace('doc_', '');
        const docKey = `doc_${docIndex}`;
        updatedVerificationStatus[docKey] = verification;
      });
      setDocumentVerificationStatus(updatedVerificationStatus);

      console.log('Reloaded verification status after updates');
    } catch (error) {
      console.error('Error ensuring document verifications:', error);
    }
  };

  const handleDocumentChange = (index: number, value: string) => {
    const docKey = `doc_${index}`;
    setDocuments(prev => ({
      ...prev,
      [docKey]: value
    }));
  };

  const handleSaveDocument = (docKey: string) => {
    setSavedDocuments(prev => new Set(prev).add(docKey));
    toast({
      title: "Dokumen Disimpan",
      description: "Link dokumen telah disimpan"
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

  const handleMarkDocumentFixed = (docKey: string) => {
    setFixedDocuments(prev => new Set(prev).add(docKey));
  };

  const handleUnmarkDocumentFixed = (docKey: string) => {
    setFixedDocuments(prev => {
      const newSet = new Set(prev);
      newSet.delete(docKey);
      return newSet;
    });
  };

  const handleSubmitApplication = async () => {
    if (!application) return;

    // Check if all required documents have links
    const allDocumentsProvided = categoryDocuments.every((_, index) => {
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
      const estimasiData = JSON.parse(application.estimasi || '{}');
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'submitted',
          keterangan: `Perbaikan - Diajukan Ulang - Kategori: Pensiun - ${estimasiData.kategori_name}${additionalNotes ? ` - ${additionalNotes}` : ''}`,
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
          const documentName = categoryDocuments[index];

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

            // Update corresponding verification status to pending (waiting for re-verification)
            const { error: updateVerificationError } = await supabase
              .from('document_verifications')
              .update({
                status: 'pending',
                document_link: newLink.trim(),
                verified_at: null,
                verified_by: null,
                admin_notes: 'Dokumen telah diperbaiki oleh pengguna - Menunggu verifikasi ulang'
              })
              .eq('application_id', id)
              .eq('document_type', `doc_${index}`);

            if (updateVerificationError) {
              console.error('Error updating verification status:', updateVerificationError);
              // Don't throw error here as document update succeeded
            }
          } else {
            // For new documents, we can't create verification records due to RLS
            // Just update the document
            const { error: insertDocError } = await supabase
              .from('documents')
              .insert({
                application_id: id,
                title: documentName,
                drive_link: newLink.trim(),
                created_by: user.id,
                document_category: 'pensiun',
                document_index: index
              });

            if (insertDocError) throw insertDocError;

            console.log('Created document but cannot create verification record due to RLS');
          }
        }
      }

      // Note: We don't create new verification records due to RLS policy
      // Existing verifications are managed by admin/system

      toast({
        title: "Berhasil",
        description: `Perbaikan usulan pensiun untuk ${estimasiData.employee_name} berhasil dikirim ulang!`
      });

      // Navigate back to main integrated app page
      navigate('/apps/pensiun', { replace: true });

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
            <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Usulan Perbaikan Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-4">
              Usulan yang perlu diperbaiki tidak ditemukan atau sudah tidak berstatus perlu perbaikan.
            </p>
            <Button onClick={() => navigate('/apps/pensiun')}>
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
        <Button variant="outline" size="sm" onClick={() => navigate('/apps/pensiun')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="warning">Perlu Perbaikan</Badge>
          <h1 className="text-3xl font-bold">Edit Perbaikan Pensiun</h1>
        </div>
      </div>

      {/* Revision Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Usulan pensiun ini memerlukan perbaikan berdasarkan feedback dari admin. Perbaiki dokumen yang ditandai dan submit ulang untuk verifikasi.
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
            {(() => {
              const estimasiData = application.estimasi ? JSON.parse(application.estimasi) : {};
              return (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{estimasiData.employee_name || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">NIP:</span>
                      <span className="font-mono text-sm">{estimasiData.employee_nip || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{estimasiData.kategori_name || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Nomor Usulan:</span>
                      <span className="font-mono text-sm">{estimasiData.nomor_usulan || '-'}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        {/* Documents Needing Fix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
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
          <CardTitle>Dokumen Persyaratan</CardTitle>
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
                      <AlertTriangle className="h-4 w-4" />
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
