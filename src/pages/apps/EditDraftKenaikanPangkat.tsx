import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from 'react-router-dom';

interface Employee {
  id: string;
  nama: string;
  nip: string | null;
  unit: string | null;
  jabatan: string | null;
  pangkat: string | null;
  tmt_cpns: string | null;
  tmt_pangkat_terakhir: string | null;
  masa_kerja: string | null;
}

interface Position {
  id: string;
  jabatan: string;
  unit: string;
}

// Define type for document requirements
interface DocumentRequirements {
  [key: string]: string[];
}

// Document requirements for each promotion category
const DOCUMENT_REQUIREMENTS: DocumentRequirements = {
  // Kenaikan Pangkat Reguler (Jabatan Pelaksana)
  reguler: [
    'SKP 2 tahun terakhir (Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai")',
    'SK Jabatan terakhir',
    'SK Pangkat terakhir',
    'Kartu Pegawai',
    'Ijazah + Transkrip nilai terakhir',
    'Nota dinas'
  ],

  // Kenaikan Pangkat Jabatan Fungsional
  fungsional: [
    'PAK tahun 2022 hingga saat ini (Catatan: Wajib 3 lembar di setiap tahun)',
    'SKP 2 tahun terakhir (Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai")',
    'SK Jabatan terakhir (Catatan: Wajib disertai sertifikat uji kompetensi bagi pegawai yang naik jenjang)',
    'SK Pangkat terakhir',
    'Kartu Pegawai',
    'Ijazah + transkrip nilai terakhir',
    'Nota dinas'
  ],
  
  // Kenaikan Pangkat Jabatan Struktural
  struktural: [
    'SKP 2 tahun terakhir (Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai")',
    'SK Jabatan terakhir',
    'SK Pangkat terakhir',
    'Kartu Pegawai',
    'Ijazah + Transkrip Nilai terakhir',
    'Surat Pernyataan Pelantikan',
    'Surat Pernyataan Melaksanakan Tugas',
    'Surat Pernyataan Menduduki Jabatan',
    'Khusus untuk Pejabat Struktural Eselon III yang pendidikan terakhirnya S1 dan pangkat terakhirnya III/d, wajib lulus diklat PIM III',
    'Nota dinas'
  ],
  
  // Kenaikan Pangkat Pertama Kali
  pertama_kali: [
    'SK CPNS',
    'SK PNS',
    'SKP 2 tahun terakhir (Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai")',
    'PAK tahun 2022 hingga saat ini (Catatan: Khusus untuk jabatan fungsional; Wajib 3 lembar di setiap tahun)',
    'SK Jabatan (Catatan: Khusus untuk jabatan fungsional)',
    'Berita Acara Pengambilan Sumpah Jabatan PNS (Catatan: Khusus untuk jabatan fungsional)',
    'SK Pangkat terakhir',
    'Kartu Pegawai',
    'Ijazah + Transkrip Nilai terakhir',
    'Nota dinas'
  ],
  
  // Kenaikan Pangkat Penyesuaian Ijazah
  penyesuaian_ijazah: [
    'Surat Tanda Lulus Ujian Penyesuaian Kenaikan Pangkat',
    'Ijazah + Transkrip Nilai terakhir yang telah dilegalisir',
    'Uraian Tugas',
    'SKP 2 tahun terakhir (Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai")',
    'SK Jabatan terakhir',
    'SK Pangkat terakhir',
    'Kartu Pegawai',
    'Nota dinas'
  ],
  
  // Kenaikan Pangkat Golongan II/d ke III/a
  iid_ke_iiia: [
    'Surat Tanda Lulus Ujian Dinas',
    'SKP 2 tahun terakhir (Catatan: Nilai minimal "Baik"; Nilai "Sangat Baik" perlu dilampirkan bukti inovasi; Wajib ada lembar "Dokumen Evaluasi Kinerja Pegawai")',
    'SK Jabatan terakhir',
    'SK Pangkat terakhir',
    'Ijazah + Transkrip nilai terakhir',
    'Kartu Pegawai',
    'Nota dinas'
  ]
};

// Default document requirements (used when category is not selected)
const DEFAULT_DOCUMENT_REQUIREMENTS = [
  'Pilih kategori kenaikan pangkat untuk melihat dokumen yang diperlukan'
];

export default function EditDraftKenaikanPangkat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [application, setApplication] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedKategori, setSelectedKategori] = useState("");
  const [selectedPeriode, setSelectedPeriode] = useState("");
  const [alasanMutasi, setAlasanMutasi] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Document management
  const [documents, setDocuments] = useState<{ [key: string]: string }>({});
  const [savedDocuments, setSavedDocuments] = useState<Set<string>>(new Set());
  
  // Get document requirements based on selected category
  const getDocumentRequirements = () => {
    if (!selectedKategori) return DEFAULT_DOCUMENT_REQUIREMENTS;
    const requirements = DOCUMENT_REQUIREMENTS[selectedKategori as keyof typeof DOCUMENT_REQUIREMENTS] || DEFAULT_DOCUMENT_REQUIREMENTS;
    
    // If we have saved documents, make sure we include them in the requirements
    const savedDocIndices = Object.keys(documents)
      .map(key => parseInt(key.replace('doc_', '')))
      .filter(index => !isNaN(index));
      
    const maxIndex = Math.max(requirements.length - 1, ...savedDocIndices);
    
    // Create an array with the correct length, filling with empty strings for missing requirements
    const result = Array(maxIndex + 1).fill('');
    requirements.forEach((req, index) => {
      result[index] = req;
    });
    
    return result;
  };
  
  const documentRequirements = getDocumentRequirements();

  useEffect(() => {
    if (id) {
      loadApplicationData();
      loadEmployees();
      loadPositions();
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
        navigate('/apps/kenaikan-pangkat');
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
          setSelectedPeriode(estimasi.periode || '');
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
      navigate('/apps/kenaikan-pangkat');
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

  const loadPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('jabatan');

      if (error) throw error;
      setPositions(data || []);
    } catch (error: any) {
      console.error('Error loading positions:', error);
    }
  };

  const kategoriOptions = {
    "reguler": "Kenaikan Pangkat Reguler (Jabatan Pelaksana)",
    "fungsional": "Kenaikan Pangkat Jabatan Fungsional",
    "struktural": "Kenaikan Pangkat Jabatan Struktural",
    "pertama_kali": "Kenaikan Pangkat Pertama Kali",
    "penyesuaian_ijazah": "Kenaikan Pangkat Penyesuaian Ijazah",
    "iid_ke_iiia": "Kenaikan Pangkat Golongan II/d ke III/a"
  };

  const periodeOptions = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

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
          kategori: selectedKategori || estimasiData.kategori,
          kategori_name: selectedKategori ? kategoriOptions[selectedKategori as keyof typeof kategoriOptions] : estimasiData.kategori_name,
          periode: selectedPeriode || estimasiData.periode,
        }),
        document_requirements: documentRequirements,
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
          const documentName = documentRequirements[index] || `Dokumen ${index + 1}`;

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
                title: documentName,
                drive_link: newLink.trim(),
                updated_at: new Date().toISOString()
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
                document_category: 'kenaikan_pangkat',
                document_index: index,
                created_at: new Date().toISOString()
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
    const currentDocRequirements = selectedKategori ? DOCUMENT_REQUIREMENTS[selectedKategori] || [] : [];
    const allDocumentsProvided = currentDocRequirements.every((_, index) => {
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
          keterangan: `Kategori: Kenaikan Pangkat${additionalNotes ? ` - ${additionalNotes}` : ''}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update existing documents with new links or create new ones
      for (const [docKey, newLink] of Object.entries(documents)) {
        if (newLink && newLink.trim() !== '') {
          const index = parseInt(docKey.replace('doc_', ''));
          const documentName = documentRequirements[index] || `Dokumen ${index + 1}`;

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
                document_category: 'kenaikan_pangkat',
                document_index: index
              });

            if (insertDocError) throw insertDocError;
          }
        }
      }

      toast({
        title: "Berhasil",
        description: `Pengajuan untuk ${estimasiData.employee_name} berhasil disubmit dan sedang menunggu verifikasi!`
      });

      // Navigate back to list
      navigate('/apps/kenaikan-pangkat?tab=list', { replace: true });

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

      navigate('/apps/kenaikan-pangkat?tab=list');
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

  const filteredEmployees = employees.filter(emp =>
    emp.nama.toLowerCase().includes('') ||
    emp.nip.includes('')
  );

  const filteredPositions = positions.filter(pos => {
    const matchesSearch = pos.unit.toLowerCase().includes('') ||
      pos.jabatan.toLowerCase().includes('');
    const matchesSelectedUnit = selectedUnit ? pos.unit === selectedUnit : true;
    return matchesSearch && matchesSelectedUnit;
  });

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
            <Button onClick={() => navigate('/apps/kenaikan-pangkat')}>
              Kembali ke Daftar Pengajuan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentDocumentRequirements = selectedKategori ? DOCUMENT_REQUIREMENTS[selectedKategori] || [] : [];
  const canSubmit = selectedKategori && Object.values(documents).filter(link => link.trim() !== '').length >= currentDocumentRequirements.length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/apps/kenaikan-pangkat')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Draft</Badge>
          <h1 className="text-3xl font-bold">Edit Draft Kenaikan Pangkat</h1>
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
                      <span className="text-sm text-muted-foreground">Periode:</span>
                      <span className="text-sm">{estimasiData.periode || '-'}</span>
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
            {documentRequirements.map((documentName, index) => {
              // Only show documents that are defined in the requirements for the selected category
              if (!documentName) return null;
              
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
