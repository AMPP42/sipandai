import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
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
  Send
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type Application = Database['public']['Tables']['applications']['Row'];
type Document = Database['public']['Tables']['documents']['Row'];

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
  'Daftar Riwayat Hidup (DRH) sesuai Keputusan Kepala BKN Nomor 11 Tahun 2002'
];

export default function DetailMutasiTerpadu() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [driveLink, setDriveLink] = useState('');

  useEffect(() => {
    if (id) {
      loadApplication();
      loadDocuments();
    }
  }, [id]);

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

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('application_id', id)
        .order('document_index');

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleSubmitApplication = async () => {
    if (!application) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'submitted',
          tanggal_pengajuan: new Date().toISOString()
        })
        .eq('id', application.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengajuan berhasil disubmit",
        variant: "default"
      });

      await loadApplication();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal submit pengajuan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadFile && !driveLink) {
      toast({
        title: "Error",
        description: "Mohon pilih file atau masukkan link Google Drive",
        variant: "destructive"
      });
      return;
    }

    if (selectedDocumentIndex === null) return;

    try {
      setUploading(true);
      
      const documentData = {
        application_id: id,
        title: DOCUMENT_REQUIREMENTS[selectedDocumentIndex],
        document_index: selectedDocumentIndex,
        document_category: 'persyaratan',
        drive_link: driveLink || null,
        created_by: user?.id
      };

      const { error } = await supabase
        .from('documents')
        .insert(documentData);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Dokumen berhasil diupload",
        variant: "default"
      });

      setUploadDialogOpen(false);
      setUploadFile(null);
      setDriveLink('');
      setSelectedDocumentIndex(null);
      await loadDocuments();

    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal upload dokumen",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'draft': 'secondary',
      'submitted': 'default',
      'in_review': 'outline',
      'approved': 'default',
      'rejected': 'destructive'
    };

    const labels: Record<string, string> = {
      'draft': 'Draft',
      'submitted': 'Diajukan',
      'in_review': 'Dalam Review',
      'approved': 'Disetujui',
      'rejected': 'Ditolak'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getDocumentStatus = (index: number) => {
    const doc = documents.find(d => d.document_index === index);
    return doc ? 'uploaded' : 'pending';
  };

  const canEdit = application?.status === 'draft' || application?.status === 'revision_needed';
  const canSubmit = canEdit && documents.length === DOCUMENT_REQUIREMENTS.length;
  const progressPercentage = Math.round((documents.length / DOCUMENT_REQUIREMENTS.length) * 100);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
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
          <h1 className="text-3xl font-bold">Detail Pengajuan Mutasi Terpadu</h1>
          <p className="text-muted-foreground">
            {application.employee_data?.nomor_usulan || 'Nomor belum tersedia'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(application.status)}
          {canSubmit && (
            <Button onClick={handleSubmitApplication} disabled={loading}>
              <Send className="w-4 h-4 mr-2" />
              Submit Pengajuan
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
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
              <span>Dokumen yang sudah diupload</span>
              <span>{documents.length} dari {DOCUMENT_REQUIREMENTS.length}</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            <p className="text-xs text-muted-foreground">
              {progressPercentage}% selesai
            </p>
          </div>
        </CardContent>
      </Card>

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

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dokumen Persyaratan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DOCUMENT_REQUIREMENTS.map((requirement, index) => {
                const status = getDocumentStatus(index);
                const document = documents.find(d => d.document_index === index);
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{requirement}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {status === 'uploaded' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className={`text-xs ${
                          status === 'uploaded' ? 'text-green-600' : 'text-amber-600'
                        }`}>
                          {status === 'uploaded' ? 'Sudah diupload' : 'Belum diupload'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {status === 'uploaded' && document?.drive_link && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(document.drive_link!, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDocumentIndex(index);
                            setUploadDialogOpen(true);
                          }}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Dokumen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDocumentIndex !== null && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {DOCUMENT_REQUIREMENTS[selectedDocumentIndex]}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Link Google Drive</Label>
              <Input
                placeholder="https://drive.google.com/..."
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Pastikan file dapat diakses oleh siapa saja dengan link
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleUploadDocument} disabled={uploading}>
                {uploading ? 'Mengupload...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}