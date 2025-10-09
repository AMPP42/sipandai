import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

interface ApplicationData {
  documents?: Record<string, string>;
  document_requirements?: string[];
  [key: string]: any;
}

interface Application {
  id: string;
  data: ApplicationData;
  status: 'draft' | 'submitted' | 'in_review' | 'revision_needed' | 'approved' | 'rejected' | 'completed' | 'biro_osdma_submitted' | 'biro_osdma_review';
  [key: string]: any;
}

export default function UploadDokumenKenaikanPangkat() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [documentRequirements, setDocumentRequirements] = useState<string[]>([]);

  // Load application data
  useEffect(() => {
    const loadApplication = async () => {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Pengajuan tidak ditemukan');

        // Cast the data to Application type
        const appData = data as unknown as Application;
        setApplication(appData);
        
        // Initialize documents state with existing data or empty strings
        const appDocuments = appData.data?.documents || {};
        const requirements = appData.data?.document_requirements || [];
        
        setDocumentRequirements(requirements);
        
        if (Object.keys(appDocuments).length > 0) {
          setDocuments(appDocuments);
        } else {
          const initialDocs: Record<string, string> = {};
          requirements.forEach((doc: string, index: number) => {
            initialDocs[`doc_${index}`] = '';
          });
          setDocuments(initialDocs);
        }
      } catch (error) {
        console.error('Error loading application:', error);
        toast({
          title: 'Error',
          description: 'Gagal memuat data pengajuan',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadApplication();
    }
  }, [id]);

  const handleDocumentChange = (index: number, value: string) => {
    setDocuments(prev => ({
      ...prev,
      [`doc_${index}`]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Validate all documents are provided
      const allDocumentsProvided = documentRequirements.every((_, index: number) => {
        const docKey = `doc_${index}`;
        return documents[docKey] && documents[docKey].trim() !== '';
      });

      if (!allDocumentsProvided) {
        toast({
          title: 'Error',
          description: 'Semua dokumen persyaratan harus diisi',
          variant: 'destructive',
        });
        return;
      }

      // Update application with documents
      const { error } = await supabase
        .from('applications')
        .update({
          data: {
            ...application.data,
            documents: documents,
            submitted_at: new Date().toISOString()
          },
          status: 'submitted' as const
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Dokumen berhasil diunggah',
      });

      // Redirect to applications list
      navigate('/apps/kenaikan-pangkat');
    } catch (error) {
      console.error('Error submitting documents:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengunggah dokumen',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!application || !application.data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Data pengajuan tidak ditemukan</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/apps/kenaikan-pangkat')}
        >
          Kembali
        </Button>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Unggah Dokumen Kenaikan Pangkat</h1>
          <p className="text-sm text-muted-foreground">
            Nomor Usulan: {application.nomor_usulan || 'Belum ada nomor'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Pegawai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Nama</p>
              <p>{application.data?.employee_name || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">NIP</p>
              <p>{application.data?.employee_nip || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Unit Kerja</p>
              <p>{application.data?.unit_asal || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Jabatan</p>
              <p>{application.data?.jabatan || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Pangkat/Golongan</p>
              <p>{application.data?.pangkat || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Kategori Kenaikan Pangkat</p>
              <p>{kategoriOptions[application.data?.kategori as keyof typeof kategoriOptions] || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dokumen Persyaratan</CardTitle>
          <p className="text-sm text-muted-foreground">
            Silakan unggah link Google Drive untuk setiap dokumen yang dibutuhkan
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {documentRequirements.length > 0 ? (
            <div className="space-y-6">
              {documentRequirements.map((doc: string, index: number) => {
                const docKey = `doc_${index}`;
                const docValue = documents[docKey] || '';
                
                return (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={docKey}>
                      {index + 1}. {doc}
                    </Label>
                    <Input
                      id={docKey}
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={docValue}
                      onChange={(e) => handleDocumentChange(index, e.target.value)}
                      className={!docValue ? 'border-destructive' : ''}
                    />
                    {docValue && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span>Link dokumen telah diisi</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">Tidak ada dokumen yang diperlukan</p>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Kembali
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || documentRequirements.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan dan Ajukan'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper for kategori options
const kategoriOptions = {
  reguler: 'Kenaikan Pangkat Reguler (Jabatan Pelaksana)',
  fungsional: 'Kenaikan Pangkat Jabatan Fungsional',
  struktural: 'Kenaikan Pangkat Jabatan Struktural',
  pertama_kali: 'Kenaikan Pangkat Pertama Kali',
  penyesuaian_ijazah: 'Kenaikan Pangkat Penyesuaian Ijazah',
  iid_iiia: 'Kenaikan Pangkat Golongan II/d ke III/a'
};
