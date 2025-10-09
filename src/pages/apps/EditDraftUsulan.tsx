import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
  AlertTriangle,
  Eye,
  FileCheck,
  XCircle,
  ExternalLink,
  Save,
  Plus,
  Search,
  Trash2
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

const MUTASI_DOCUMENT_REQUIREMENTS = [
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

interface Employee {
  id: string;
  nama: string;
  nip: string;
  unit: string;
  jabatan: string;
  pangkat: string;
}

interface Position {
  id: string;
  unit: string;
  jabatan: string;
  existing: number;
  kebutuhan: number;
  gap: number;
  status: string;
}

export default function EditDraftUsulan() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [documents, setDocuments] = useState<{ [key: string]: string }>({});
  const [isEditing, setIsEditing] = useState(true);
  const [savedDocuments, setSavedDocuments] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);

  // Edit form state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [searchPosition, setSearchPosition] = useState('');
  const [searchUnit, setSearchUnit] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [alasanMutasi, setAlasanMutasi] = useState('');
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [workUnits, setWorkUnits] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      loadApplication();
    }
    loadReferenceData();
  }, [id]);

  useEffect(() => {
    if (application?.status === 'draft') {
      loadApplicationForEdit();
    }
  }, [application]);

  const loadReferenceData = async () => {
    try {
      // Load work units
      const { data: units, error: unitsError } = await supabase
        .from('work_units')
        .select('name')
        .eq('is_active', true)
        .order('name');

      if (unitsError) throw unitsError;
      const unitNames = units?.map(u => u.name) || [];
      setWorkUnits(unitNames);

      // Load employees
      let query = supabase
        .from('employees')
        .select('*')
        .order('nama');

      if (user?.role === 'admin_unit' && user?.unit) {
        query = query.eq('unit', user.unit);
      }

      const { data: employeesData, error: employeesError } = await query;
      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);

      // Load positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .order('unit', { ascending: true });

      if (positionsError) throw positionsError;
      setPositions(positionsData || []);
    } catch (error: any) {
      console.error('Error loading reference data:', error);
    }
  };

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

        // Initialize form with existing data for drafts
        if (appData.status === 'draft' && appData.employee_data) {
          setSelectedEmployee({
            id: appData.employee_data.employee_id,
            nama: appData.employee_data.employee_name,
            nip: appData.employee_data.employee_nip,
            unit: appData.employee_data.unit_asal,
            jabatan: '', // Not stored in employee_data
            pangkat: ''  // Not stored in employee_data
          });
          setSelectedUnit(appData.employee_data.unit_tujuan);
          setAlasanMutasi(appData.employee_data.alasan_mutasi || '');
        }
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
    if (!application || !application.employee_data || !user?.id) return;

    try {
      setIsSubmitting(true);

      // Update application data
      const updateData: any = {
        estimasi: JSON.stringify({
          ...application.employee_data,
          employee_name: selectedEmployee?.nama || application.employee_data.employee_name,
          employee_nip: selectedEmployee?.nip || application.employee_data.employee_nip,
          unit_asal: selectedEmployee?.unit || application.employee_data.unit_asal,
          unit_tujuan: selectedUnit || application.employee_data.unit_tujuan,
          jabatan_tujuan: selectedPosition?.jabatan || application.employee_data.jabatan_tujuan,
          alasan_mutasi: alasanMutasi,
          nomor_usulan: application.employee_data.nomor_usulan
        }),
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // Delete existing documents
      const { error: deleteDocsError } = await supabase
        .from('documents')
        .delete()
        .eq('application_id', id);

      if (deleteDocsError) throw deleteDocsError;

      // Insert updated documents
      const documentInserts = Object.entries(documents)
        .filter(([key, link]) => link.trim() !== '')
        .map(([key, link]) => {
          const index = parseInt(key.replace('doc_', ''));
          const documentName = MUTASI_DOCUMENT_REQUIREMENTS[index];
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

      setDraftSaved(true);
      toast({
        title: "Berhasil",
        description: `Draft berhasil diperbarui dengan ${documentInserts.length} dokumen`
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
    if (!application || !application.employee_data) return;

    // Check if all documents are provided for final submission
    const allDocumentsProvided = MUTASI_DOCUMENT_REQUIREMENTS.every((_, index) => {
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
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'submitted',
          tanggal_pengajuan: new Date().toISOString(),
          keterangan: `Kategori: Mutasi Terpadu${additionalNotes ? ` - ${additionalNotes}` : ''}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update existing documents with new links or create new ones
      for (const [docKey, newLink] of Object.entries(documents)) {
        if (newLink && newLink.trim() !== '') {
          const index = parseInt(docKey.replace('doc_', ''));
          const documentName = MUTASI_DOCUMENT_REQUIREMENTS[index];

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
                document_category: 'mutasi_terpadu',
                document_index: index
              });

            if (insertDocError) throw insertDocError;
          }
        }
      }

      toast({
        title: "Berhasil",
        description: `Pengajuan untuk ${application.employee_data.employee_name} berhasil disubmit dan sedang menunggu verifikasi!`
      });

      // Navigate back to list
      navigate('/apps/pengajuan-mutasi-terpadu?tab=list', { replace: true });

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

      navigate('/apps/pengajuan-mutasi-terpadu?tab=list');
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
    emp.nama.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    emp.nip.includes(searchEmployee)
  );

  const filteredUnits = workUnits.filter(unit =>
    unit.toLowerCase().includes(searchUnit.toLowerCase())
  );

  const filteredPositions = positions.filter(pos => {
    const matchesSearch = pos.unit.toLowerCase().includes(searchPosition.toLowerCase()) ||
      pos.jabatan.toLowerCase().includes(searchPosition.toLowerCase());
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
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Draft Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-4">
              Draft yang Anda cari tidak ditemukan atau sudah tidak berstatus draft.
            </p>
            <Button onClick={() => navigate('/apps/pengajuan-mutasi-terpadu')}>
              Kembali ke Daftar Pengajuan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canSubmit = Object.values(documents).filter(link => link.trim() !== '').length === MUTASI_DOCUMENT_REQUIREMENTS.length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/apps/pengajuan-mutasi-terpadu')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Draft</Badge>
          <h1 className="text-3xl font-bold">Edit Draft Usulan</h1>
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
            {MUTASI_DOCUMENT_REQUIREMENTS.map((documentName, index) => {
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
