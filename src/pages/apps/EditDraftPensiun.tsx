import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Trash2,
  FileText,
  User,
  TrendingUp,
  CheckCircle,
  Loader2
} from "lucide-react";

interface Employee {
  id: string;
  nama: string;
  nip: string | null;
  tanggal_lahir: string | null;
  tmt_pensiun: string | null;
  unit: string | null;
  jabatan: string | null;
  pangkat: string | null;
  masa_kerja: string | null;
}

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

export default function EditDraftPensiun() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [application, setApplication] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Form fields
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedKategori, setSelectedKategori] = useState("");

  // Document management
  const [documents, setDocuments] = useState<{ [key: string]: string }>({});
  const [savedDocuments, setSavedDocuments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) {
      loadApplicationData();
      loadEmployees();
    }
  }, [id]);

  const loadApplicationData = async () => {
    try {
      setLoading(true);
      const { data: app, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (app.status !== 'draft') {
        toast({
          title: "Error",
          description: "Aplikasi ini tidak dalam status draft",
          variant: "destructive"
        });
        navigate('/apps/pensiun');
        return;
      }

      setApplication(app);

      // Load employee data from estimasi
      const estimasi = JSON.parse(app.estimasi || '{}');
      if (estimasi.employee_id) {
        const { data: employee } = await supabase
          .from('employees')
          .select('*')
          .eq('id', estimasi.employee_id)
          .single();

        if (employee) {
          setSelectedEmployee(employee);
          setSelectedKategori(estimasi.kategori || '');
        }
      }

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

      toast({
        title: "Data Dimuat",
        description: "Data draft berhasil dimuat untuk diedit"
      });
    } catch (error) {
      console.error('Error loading application data for edit:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data draft untuk edit",
        variant: "destructive"
      });
      navigate('/apps/pensiun');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      let query = supabase
        .from('employees')
        .select('*')
        .order('nama');

      if (user?.role === 'admin_unit' && user?.unit) {
        query = query.eq('unit', user.unit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error loading employees:', error);
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

  const handleSaveDraft = async () => {
    if (!application || !user?.id) return;

    try {
      setIsSubmitting(true);

      // Update application data
      const estimasiData = JSON.parse(application.estimasi || '{}');
      const updateData: any = {
        estimasi: JSON.stringify({
          ...estimasiData,
          employee_id: selectedEmployee?.id,
          employee_name: selectedEmployee?.nama,
          employee_nip: selectedEmployee?.nip,
          kategori: selectedKategori || estimasiData.kategori,
          kategori_name: selectedKategori ? retirementCategories[selectedKategori as keyof typeof retirementCategories].label : estimasiData.kategori_name,
          nomor_usulan: estimasiData.nomor_usulan,
          unit: selectedEmployee?.unit,
          jabatan: selectedEmployee?.jabatan,
          pangkat: selectedEmployee?.pangkat
        }),
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // Update existing documents with new links or create new ones
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
          } else {
            // Create new document
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
          }
        }
      }

      toast({
        title: "Berhasil",
        description: `Draft berhasil diperbarui dengan ${Object.keys(documents).length} dokumen`
      });

    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui draft",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!application) return;

    // Check if all documents are provided for final submission
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

      // Update application status to submitted
      const estimasiData = JSON.parse(application.estimasi || '{}');
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'submitted',
          tanggal_pengajuan: new Date().toISOString(),
          keterangan: `Kategori: Pensiun - ${estimasiData.kategori_name}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update existing documents with new links or create new ones
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
          } else {
            // Create new document
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
          }
        }
      }

      toast({
        title: "Berhasil",
        description: `Pengajuan pensiun untuk ${estimasiData.employee_name} berhasil disubmit dan sedang menunggu verifikasi!`
      });

      // Navigate back to list
      navigate('/apps/pensiun?tab=list', { replace: true });

    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Gagal submit pengajuan",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus draft ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Draft berhasil dihapus"
      });

      navigate('/apps/pensiun?tab=list');
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus draft",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Memuat data draft...</span>
        </div>
      </div>
    );
  }

  if (!application || application.status !== 'draft') {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Draft Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-4">
              Draft yang Anda cari tidak ditemukan atau sudah tidak berstatus draft.
            </p>
            <Button onClick={() => navigate('/apps/pensiun')}>
              Kembali ke Daftar Pengajuan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get documents for selected category
  const getCategoryDocuments = () => {
    if (!selectedKategori || !retirementCategories[selectedKategori as keyof typeof retirementCategories]) {
      return PENSIUN_DOCUMENT_REQUIREMENTS;
    }
    return retirementCategories[selectedKategori as keyof typeof retirementCategories].documents;
  };

  const categoryDocuments = getCategoryDocuments();

  const canSubmit = Object.values(documents).filter(link => link.trim() !== '').length === categoryDocuments.length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/apps/pensiun')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Draft</Badge>
          <h1 className="text-3xl font-bold">Edit Draft Pensiun</h1>
        </div>
      </div>

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

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Aksi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="w-full"
              variant="outline"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Draft'}
            </Button>

            <Button
              onClick={handleSubmitApplication}
              disabled={isSubmitting || !canSubmit}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submit...' : 'Submit Pengajuan'}
            </Button>

            <Button
              onClick={handleDeleteDraft}
              disabled={isSubmitting}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Draft
            </Button>

            {!canSubmit && (
              <p className="text-sm text-muted-foreground text-center">
                Lengkapi semua dokumen sebelum submit
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumen Persyaratan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryDocuments.map((documentName, index) => {
              const docKey = `doc_${index}`;
              const isSaved = savedDocuments.has(docKey);
              const hasLink = documents[docKey] && documents[docKey].trim() !== '';

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-primary min-w-6">
                        {index + 1}.
                      </span>
                      <Label className="text-sm font-medium">{documentName}</Label>
                      {hasLink && <CheckCircle className="w-4 h-4 text-green-600" />}
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
                  <Input
                    placeholder="Masukkan link Google Drive..."
                    value={documents[docKey] || ''}
                    onChange={(e) => handleDocumentChange(index, e.target.value)}
                    disabled={isSaved}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
