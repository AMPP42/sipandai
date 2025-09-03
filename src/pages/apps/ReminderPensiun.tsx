import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from 'react-router-dom';
import DocumentVerificationStatus from "@/components/applications/DocumentVerificationStatus";
import { 
  Calendar, 
  Clock, 
  Bell, 
  FileText,
  User,
  AlertTriangle,
  CheckCircle,
  Download,
  Search,
  Send,
  Upload,
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

interface PensiunData {
  id: string;
  nama: string;
  nip: string;
  tanggalLahir: string;
  tanggalPensiun: string;
  sisaHari: number;
  unitKerja: string;
  jabatan: string;
  pangkat: string;
  masaKerja: string;
  statusPersiapan: 'belum_mulai' | 'dalam_proses' | 'hampir_selesai' | 'siap';
}

interface RetirementApplication {
  id: string;
  judul: string;
  jenis: string;
  status: string;
  tanggal_pengajuan: string;
  estimasi: string;
  progress: number;
  submitter_name: string;
  submitter_unit: string;
}

interface ChecklistItem {
  id: string;
  nama: string;
  deskripsi: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  deadline?: string;
}

export default function ReminderPensiun() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<PensiunData | null>(null);
  const [retirementCategory, setRetirementCategory] = useState("");
  const [documents, setDocuments] = useState<{ [key: string]: string }>({});
  const [pensiunData, setPensiunData] = useState<PensiunData[]>([]);
  const [applications, setApplications] = useState<RetirementApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployeeData();
    fetchApplications();
    
    // Check if we're in edit mode
    const urlParams = new URLSearchParams(location.search);
    const editId = urlParams.get('edit');
    if (editId) {
      setIsEditing(true);
      setEditingApplicationId(editId);
      setActiveTab("pengajuan");
      loadApplicationData(editId);
    }
  }, [location.search]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const { data: employees, error } = await supabase
        .from('employees')
        .select('id, nama, nip, tanggal_lahir, tmt_pensiun, unit, jabatan, pangkat, masa_kerja')
        .not('tmt_pensiun', 'is', null)
        .order('tmt_pensiun', { ascending: true });

      if (error) throw error;

      // Transform employee data to pension data with calculations
      const transformedData: PensiunData[] = (employees || []).map((emp: Employee) => {
        const today = new Date();
        const pensionDate = new Date(emp.tmt_pensiun!);
        const timeDiff = pensionDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Determine preparation status based on days remaining
        let statusPersiapan: 'belum_mulai' | 'dalam_proses' | 'hampir_selesai' | 'siap';
        if (daysDiff <= 30) {
          statusPersiapan = 'siap';
        } else if (daysDiff <= 90) {
          statusPersiapan = 'hampir_selesai';
        } else if (daysDiff <= 365) {
          statusPersiapan = 'dalam_proses';
        } else {
          statusPersiapan = 'belum_mulai';
        }

        return {
          id: emp.id,
          nama: emp.nama,
          nip: emp.nip || '-',
          tanggalLahir: emp.tanggal_lahir || '',
          tanggalPensiun: emp.tmt_pensiun || '',
          sisaHari: Math.max(0, daysDiff),
          unitKerja: emp.unit || '-',
          jabatan: emp.jabatan || '-',
          pangkat: emp.pangkat || '-',
          masaKerja: emp.masa_kerja || '-',
          statusPersiapan
        };
      });

      setPensiunData(transformedData);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast({
        title: "Error",
        description: "Gagal mengambil data pegawai",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoadingApplications(true);
      const { data: apps, error } = await supabase
        .from('applications')
        .select('*')
        .eq('jenis', 'pensiun')
        .eq('submitter_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedApps: RetirementApplication[] = (apps || []).map(app => ({
        id: app.id,
        judul: app.judul || 'Pengajuan Pensiun',
        jenis: app.jenis,
        status: app.status,
        tanggal_pengajuan: app.tanggal_pengajuan || app.created_at,
        estimasi: app.estimasi || '14-30 hari kerja',
        progress: app.progress || 0,
        submitter_name: app.submitter_name || 'Tidak diketahui',
        submitter_unit: app.submitter_unit || 'Tidak diketahui'
      }));

      setApplications(transformedApps);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Gagal mengambil data pengajuan",
        variant: "destructive"
      });
    } finally {
      setLoadingApplications(false);
    }
  };

  const loadApplicationData = async (applicationId: string) => {
    try {
      // Load application data
      const { data: applicationData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;

      // Load documents
      const { data: documentsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('application_id', applicationId)
        .order('document_index');

      if (docsError) throw docsError;

      // Extract retirement category from keterangan
      const kategorMatch = applicationData.keterangan?.match(/Kategori: (.+)/);
      if (kategorMatch) {
        const categoryLabel = kategorMatch[1];
        const categoryKey = Object.keys(retirementCategories).find(key => 
          retirementCategories[key as keyof typeof retirementCategories].label === categoryLabel
        );
        if (categoryKey) {
          setRetirementCategory(categoryKey);
        }
      }

      // Populate documents
      const loadedDocuments: { [key: string]: string } = {};
      documentsData.forEach(doc => {
        if (doc.document_index !== null) {
          loadedDocuments[`doc_${doc.document_index}`] = doc.drive_link || '';
        }
      });
      setDocuments(loadedDocuments);

      // Set selected employee based on submitter info
      const employeeData: PensiunData = {
        id: applicationData.submitter_id,
        nama: applicationData.submitter_name || '',
        nip: '',
        tanggalLahir: '',
        tanggalPensiun: '',
        sisaHari: 0,
        unitKerja: applicationData.submitter_unit || '',
        jabatan: '',
        pangkat: '',
        masaKerja: '',
        statusPersiapan: 'dalam_proses'
      };
      setSelectedEmployee(employeeData);

      toast({
        title: "Data Dimuat",
        description: "Data usulan berhasil dimuat untuk diedit"
      });

    } catch (error) {
      console.error('Error loading application data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data usulan",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      belum_mulai: { label: "Belum Mulai", className: "bg-gray-100 text-gray-700" },
      dalam_proses: { label: "Dalam Proses", className: "bg-blue-100 text-blue-700" },
      hampir_selesai: { label: "Hampir Selesai", className: "bg-yellow-100 text-yellow-700" },
      siap: { label: "Siap Pensiun", className: "bg-green-100 text-green-700" }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.belum_mulai;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getApplicationStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
      submitted: { label: "Menunggu Verifikasi", className: "bg-yellow-100 text-yellow-700" },
      in_review: { label: "Sedang Ditinjau", className: "bg-blue-100 text-blue-700" },
      approved: { label: "Disetujui", className: "bg-green-100 text-green-700" },
      rejected: { label: "Ditolak", className: "bg-red-100 text-red-700" },
      revision_needed: { label: "Perlu Revisi", className: "bg-orange-100 text-orange-700" }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'in_review': return <Search className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <AlertTriangle className="w-4 h-4" />;
      case 'revision_needed': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const hitungProgressPersiapan = (checklist: ChecklistItem[]) => {
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  const formatSisaWaktu = (sisaHari: number) => {
    if (sisaHari < 30) {
      return `${sisaHari} hari lagi`;
    } else if (sisaHari < 365) {
      const bulan = Math.floor(sisaHari / 30);
      const hari = sisaHari % 30;
      return `${bulan} bulan ${hari} hari lagi`;
    } else {
      const tahun = Math.floor(sisaHari / 365);
      const bulan = Math.floor((sisaHari % 365) / 30);
      return `${tahun} tahun ${bulan} bulan lagi`;
    }
  };

  const filteredPensiunData = pensiunData.filter(pegawai =>
    pegawai.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pegawai.nip.includes(searchTerm)
  );

  const retirementCategories = {
    "pensiun_reguler": {
      label: "Pensiun Reguler",
      documents: [
        "Surat Permohonan Pensiun dari Ybs (tanpa kop unit kerja)",
        "Daftar Susunan Keluarga - pastikan jumlah anak sama dengan di DPCPP",
        "Bila anak sudah berkeluarga, tetap dimasukkan saja untuk data",
        "Kartu Pegawai (KARPEG)",
        "Optional - Akte / Surat Nikah",
        "Akte Kelahiran Anak (apabila masih ada anak yang menjadi tanggungan)",
        "SK Pengangkatan sebagai CPNS",
        "SK Pengangkatan CPNS menjadi PNS",
        "SK Kenaikan Pangkat terakhir",
        "Kenaikan Gaji Berkala Terakhir",
        "Penilaian Prestasi Kerja (SKP) 2 Tahun Terakhir",
        "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat dalam 1 Tahun Terakhir",
        "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana",
        "Foto Pegawai ybs",
        "Data Perorangan Calon Penerima Pensiun (DPCPP) - pastikan jumlah anak sama dengan di Daftar Susunan Keluarga",
        "Surat Keterangan Kematian (Bila ada suami/istri yang sudah meninggal dunia)",
        "KTP",
        "NPWP",
        "Buku Tabungan (lembar yang terdapat nomor rekening)",
        "Surat Keterangan Sekolah / Kuliah (bila terdapat anak yang masih menjadi tanggungan)"
      ]
    },
    "pensiun_janda_duda": {
      label: "Pensiun Janda/Duda (PNS Meninggal)",
      documents: [
        "Surat Permohonan Pensiun dari Janda / Duda Ybs (tanpa kop)",
        "Daftar Susunan Keluarga (Dokumen Asli)",
        "Kartu Pegawai (KARPEG) almarhum/ah",
        "Surat Nikah",
        "Akte Kelahiran Anak",
        "SK Pengangkatan sebagai CPNS almarhum/ah",
        "SK Pengangkatan CPNS menjadi PNS almarhum/ah",
        "SK Kenaikan Pangkat almarhum/ah",
        "Gaji Berkala Terakhir almarhum/ah",
        "Penilaian Prestasi Kerja 2 Tahun Terakhir almarhum/ah",
        "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat dalam 1 Tahun Terakhir almarhum/ah",
        "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana almarhum/ah",
        "Data Perorangan Calon Penerima Pensiun (DPCPP)",
        "Foto Janda / Duda ybs",
        "Surat Keterangan Kematian yang Sah (harus dari Dukcapil)",
        "Surat Keterangan Janda / Duda dari Kelurahan",
        "Kartu Istri (KARIS) utk pensiun janda atau Kartu Suami (KARSU) untuk pensiun duda",
        "KTP janda/duda/KK",
        "NPWP janda/duda",
        "Buku Tabungan janda/duda",
        "Surat Keterangan Sekolah / Kuliah (bila terdapat anak yang masih menjadi tanggungan)"
      ]
    },
    "pensiun_anak": {
      label: "Pensiun Anak (PNS dan pasangan meninggal dunia, anak berusia dibawah 25 tahun dan belum berumah tangga)",
      documents: [
        "Surat Permohonan Pensiun dari Anak (ttd anak, tanpa kop)",
        "Akte Anak",
        "Daftar Susunan Keluarga",
        "Kartu Pegawai (KARPEG)",
        "Surat Nikah",
        "SK Pengangkatan sebagai CPNS",
        "SK Pengangkatan CPNS menjadi PNS",
        "SK Kenaikan Pangkat",
        "Gaji Berkala Terakhir",
        "Penilaian Prestasi Kerja 2 Tahun Terakhir",
        "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat dalam 1 Tahun Terakhir",
        "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana",
        "Data Perorangan Calon Penerima Pensiun (DPCPP) (ttd anak)",
        "Foto Anak",
        "Surat Keterangan Kematian yang Sah"
      ]
    },
    "masa_persiapan_pensiun": {
      label: "Masa Persiapan Pensiun (3 bulan s.d 1 tahun sebelum TMT Pensiun)",
      documents: [
        "Surat Permohonan Pensiun dari Ybs (tanpa kop)",
        "Kartu Pegawai (KARPEG)",
        "Surat Nikah",
        "SK Pengangkatan sebagai CPNS",
        "SK Pengangkatan CPNS menjadi PNS",
        "SK Kenaikan Pangkat",
        "Gaji Berkala Terakhir",
        "Penilaian Prestasi Kerja 2 Tahun Terakhir",
        "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat dalam 1 Tahun Terakhir",
        "Foto Pegawai ybs",
        "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana"
      ]
    },
    "pensiun_dini": {
      label: "Pensiun Dini (Usia harus berusia 50 Tahun Dengan masa kerja 20 tahun)",
      documents: [
        "Surat Permohonan Pensiun dari Ybs (tanpa kop)",
        "Daftar Susunan Keluarga (ttd Lurah dan Camat)",
        "Kartu Pegawai (KARPEG)",
        "Akte / Surat Nikah",
        "Akte Kelahiran Anak",
        "SK Pengangkatan sebagai CPNS",
        "SK Pengangkatan CPNS menjadi PNS",
        "SK Kenaikan Pangkat terakhir",
        "Kenaikan Gaji Berkala Terakhir",
        "Penilaian Prestasi Kerja 2 Tahun Terakhir",
        "Surat Pernyataan Tidak Pernah Dijatuhi Hukuman Disiplin Sedang/Berat dalam 1 Tahun Terakhir",
        "Data Perorangan Calon Penerima Pensiun (DPCPP)",
        "Foto Pegawai ybs",
        "Surat Pernyataan Tidak Sedang Menjalani Proses Pidana"
      ]
    },
    "pensiun_anumerta": {
      label: "Pensiun Anumerta (Meninggal saat menjalankan tugas)",
      documents: [
        "SK pangkat terakhir",
        "KGB terakhir",
        "KARPEG",
        "Berita Acara tentang kejadian yang mengakibatkan ybs meninggal dunia",
        "Visum et repertum",
        "surat perintah penugasan/surat keterangan yang menyatakan ybs meninggal karena dinas",
        "Laporan dari pimpinan unit kerja yang menyatakan bahwa ybs meninggal krn dinas",
        "KP Anumerta sementara",
        "Foto Diri Terbaru",
        "Surat Nikah",
        "Akte Anak"
      ]
    },
    "karsu_karis": {
      label: "Karsu/Karis",
      documents: [
        "Laporan Perkawinan Pertama / Kedua dari ybs",
        "Surat Keterangan Kematian jika perkawinan sebelumnya pasangan meninggal dunia",
        "Surat Izin Cerai dari Kementerian jika perkawinan sebelumnya mengalami Perceraian",
        "Daftar Susunan Keluarga",
        "Surat Nikah / Akte Perkawinan",
        "Pas foto pasangan terbaru ukuran 2x3"
      ]
    }
  };

  const handleSelectEmployee = (pegawai: PensiunData) => {
    setSelectedEmployee(pegawai);
    setActiveTab("pengajuan");
  };

  const handleDocumentChange = (index: number, value: string) => {
    setDocuments(prev => ({
      ...prev,
      [`doc_${index}`]: value
    }));
  };

  const handleSubmitPengajuan = async () => {
    if (!selectedEmployee || !retirementCategory) {
      toast({
        title: "Error", 
        description: "Pilih pegawai dan kategori pensiun terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    // Check if at least one document is provided
    const documentEntries = Object.entries(documents).filter(([key, link]) => link.trim() !== '');
    if (documentEntries.length === 0) {
      toast({
        title: "Error", 
        description: "Harap upload minimal satu dokumen persyaratan",
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
      if (isEditing && editingApplicationId) {
        // Update existing application
        const { error: updateError } = await supabase
          .from('applications')
          .update({
            submitter_name: selectedEmployee.nama,
            submitter_unit: selectedEmployee.unitKerja,
            judul: `Pengajuan Pensiun - ${selectedEmployee.nama}`,
            status: 'submitted',
            keterangan: `Perbaikan - Diajukan Ulang - Kategori: ${retirementCategories[retirementCategory as keyof typeof retirementCategories].label}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingApplicationId);

        if (updateError) throw updateError;

        // Delete existing documents
        const { error: deleteDocsError } = await supabase
          .from('documents')
          .delete()
          .eq('application_id', editingApplicationId);

        if (deleteDocsError) throw deleteDocsError;

        // Insert new documents
        const documentInserts = Object.entries(documents)
          .filter(([key, link]) => link.trim() !== '')
          .map(([key, link]) => {
            const index = parseInt(key.replace('doc_', ''));
            const documentName = retirementCategories[retirementCategory as keyof typeof retirementCategories].documents[index];
            
            return {
              application_id: editingApplicationId,
              title: documentName,
              drive_link: link.trim(),
              created_by: user.id,
              document_category: 'pensiun',
              document_index: index
            };
          });

        if (documentInserts.length > 0) {
          const { error: documentsError } = await supabase
            .from('documents')
            .insert(documentInserts);

          if (documentsError) throw documentsError;
        }
      } else {
        // Create new retirement application record
        const { data: applicationData, error: applicationError } = await supabase
          .from('applications')
          .insert({
            submitter_id: user.id,
            submitter_name: selectedEmployee.nama,
            submitter_unit: selectedEmployee.unitKerja,
            judul: `Pengajuan Pensiun - ${selectedEmployee.nama}`,
            jenis: 'pensiun',
            status: 'submitted',
            keterangan: `Kategori: ${retirementCategories[retirementCategory as keyof typeof retirementCategories].label}`,
            tanggal_pengajuan: new Date().toISOString(),
            estimasi: '14-30 hari kerja'
          })
          .select()
          .single();

        if (applicationError) throw applicationError;

        // Insert documents with their links
        const documentInserts = Object.entries(documents)
          .filter(([key, link]) => link.trim() !== '')
          .map(([key, link]) => {
            const index = parseInt(key.replace('doc_', ''));
            const documentName = retirementCategories[retirementCategory as keyof typeof retirementCategories].documents[index];
            
            return {
              application_id: applicationData.id,
              title: documentName,
              drive_link: link.trim(),
              created_by: user.id,
              document_category: 'pensiun',
              document_index: index
            };
          });

        if (documentInserts.length > 0) {
          const { error: documentsError } = await supabase
            .from('documents')
            .insert(documentInserts);

          if (documentsError) throw documentsError;
        }
      }

      toast({
        title: "Berhasil",
        description: isEditing 
          ? `Perbaikan usulan pensiun untuk ${selectedEmployee.nama} berhasil dikirim ulang!`
          : `Pengajuan pensiun untuk ${selectedEmployee.nama} berhasil disubmit dan sedang menunggu verifikasi!`,
      });
      
      // Navigate back to status page or refresh
      if (isEditing) {
        navigate('/status-usulan');
      } else {
        await fetchApplications();
        setSelectedEmployee(null);
        setRetirementCategory("");
        setDocuments({});
        setActiveTab("status");
      }
    } catch (error) {
      console.error('Error submitting retirement application:', error);
      toast({
        title: "Error",
        description: isEditing ? "Gagal mengirim ulang usulan pensiun" : "Gagal mengajukan usulan pensiun",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              Administrasi & Reminder Pensiun
            </h1>
            <p className="text-muted-foreground mt-2">
              Auto-reminder dan dashboard countdown persiapan pensiun pegawai
            </p>
          </div>
          <div className="flex gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Badge className="bg-red-100 text-red-700">
                  {pensiunData.filter(p => p.sisaHari <= 90).length} Urgen (≤3 bulan)
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-700">
                  {pensiunData.filter(p => p.sisaHari <= 365 && p.sisaHari > 90).length} Perlu Perhatian (≤1 tahun)
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Dashboard Countdown
            </TabsTrigger>
            <TabsTrigger value="pengajuan" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Pengajuan Pensiun
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Status Usulan
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Generate Dokumen
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dashboard Countdown */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {pensiunData.filter(p => p.sisaHari <= 90).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Urgen ≤3 bulan</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {pensiunData.filter(p => p.sisaHari <= 365 && p.sisaHari > 90).length}
                      </p>
                      <p className="text-sm text-muted-foreground">≤1 tahun</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {pensiunData.filter(p => p.statusPersiapan === 'siap').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Siap Pensiun</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{pensiunData.length}</p>
                      <p className="text-sm text-muted-foreground">Total Pegawai</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Cari pegawai berdasarkan nama atau NIP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button variant="outline">
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pegawai List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Memuat data pegawai...</span>
              </div>
            ) : pensiunData.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Tidak Ada Data Pegawai</h3>
                  <p className="text-muted-foreground">
                    Belum ada data pegawai dengan informasi TMT Pensiun
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPensiunData.map((pegawai) => (
                <Card key={pegawai.id} className={`border ${pegawai.sisaHari <= 90 ? 'border-red-200 bg-red-50' : pegawai.sisaHari <= 365 ? 'border-yellow-200 bg-yellow-50' : 'border-border'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground">{pegawai.nama}</h3>
                          {getStatusBadge(pegawai.statusPersiapan)}
                          {pegawai.sisaHari <= 90 && (
                            <Badge className="bg-red-100 text-red-700">
                              URGEN
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">NIP</p>
                            <p className="font-mono">{pegawai.nip}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Unit Kerja</p>
                            <p className="font-medium">{pegawai.unitKerja}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Jabatan</p>
                            <p className="font-medium">{pegawai.jabatan}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pangkat</p>
                            <p className="font-medium">{pegawai.pangkat}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Masa Kerja</p>
                            <p className="font-medium">{pegawai.masaKerja}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">TMT Pensiun</p>
                            <p className="font-medium">
                              {new Date(pegawai.tanggalPensiun).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-2xl font-bold text-primary mb-1">
                          {formatSisaWaktu(pegawai.sisaHari)}
                        </div>
                        <Progress 
                          value={Math.max(0, 100 - (pegawai.sisaHari / 730) * 100)} 
                          className="w-24 h-2"
                        />
                        <p className="text-xs text-muted-foreground mb-2">
                          Progress ke pensiun
                        </p>
                        <Button 
                          size="sm"
                          onClick={() => handleSelectEmployee(pegawai)}
                          className="w-full"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Ajukan Usulan Pensiun
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Pengajuan Pensiun */}
          <TabsContent value="pengajuan" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengajuan Usulan Pensiun</CardTitle>
                <CardDescription>
                  Form pengajuan usulan pensiun dengan kategori dan dokumen persyaratan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Employee Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee-select">Pilih Pegawai</Label>
                    <Select onValueChange={(value) => {
                      const employee = pensiunData.find(p => p.id === value);
                      if (employee) setSelectedEmployee(employee);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pegawai yang akan diusulkan pensiun" />
                      </SelectTrigger>
                      <SelectContent>
                        {pensiunData.map((pegawai) => (
                          <SelectItem key={pegawai.id} value={pegawai.id}>
                            {pegawai.nama} - {pegawai.nip}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Employee Info */}
                  {selectedEmployee && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Data Pegawai Terpilih</h4>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                           <div>
                             <p className="text-blue-600">Nama</p>
                             <p className="font-medium text-blue-900">{selectedEmployee.nama}</p>
                           </div>
                           <div>
                             <p className="text-blue-600">NIP</p>
                             <p className="font-mono text-blue-900">{selectedEmployee.nip}</p>
                           </div>
                           <div>
                             <p className="text-blue-600">Unit Kerja</p>
                             <p className="font-medium text-blue-900">{selectedEmployee.unitKerja}</p>
                           </div>
                           <div>
                             <p className="text-blue-600">Jabatan</p>
                             <p className="font-medium text-blue-900">{selectedEmployee.jabatan}</p>
                           </div>
                           <div>
                             <p className="text-blue-600">Pangkat</p>
                             <p className="font-medium text-blue-900">{selectedEmployee.pangkat}</p>
                           </div>
                           <div>
                             <p className="text-blue-600">Masa Kerja</p>
                             <p className="font-medium text-blue-900">{selectedEmployee.masaKerja}</p>
                           </div>
                           <div>
                             <p className="text-blue-600">Sisa Waktu</p>
                             <p className="font-medium text-blue-900">{formatSisaWaktu(selectedEmployee.sisaHari)}</p>
                           </div>
                           <div>
                             <p className="text-blue-600">TMT Pensiun</p>
                             <p className="font-medium text-blue-900">
                               {new Date(selectedEmployee.tanggalPensiun).toLocaleDateString('id-ID')}
                             </p>
                           </div>
                         </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Retirement Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="category-select">Kategori Pensiun</Label>
                  <Select value={retirementCategory} onValueChange={setRetirementCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori pensiun" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(retirementCategories).map(([key, category]) => (
                        <SelectItem key={key} value={key}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Document Requirements */}
                {retirementCategory && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Dokumen Persyaratan - {retirementCategories[retirementCategory as keyof typeof retirementCategories].label}
                      </CardTitle>
                      <CardDescription>
                        Silakan upload link Google Drive untuk setiap dokumen yang diperlukan
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {retirementCategories[retirementCategory as keyof typeof retirementCategories].documents.map((doc, index) => (
                          <div key={index} className="space-y-2">
                            <Label htmlFor={`doc-${index}`} className="text-sm font-medium">
                              {index + 1}. {doc}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id={`doc-${index}`}
                                placeholder="Masukkan link Google Drive dokumen..."
                                value={documents[`doc_${index}`] || ""}
                                onChange={(e) => handleDocumentChange(index, e.target.value)}
                              />
                              <Button variant="outline" size="icon">
                                <Upload className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Masukkan catatan atau keterangan tambahan jika diperlukan..."
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab("status")}
                    className="min-w-32"
                  >
                    Lihat Status Pengajuan
                  </Button>
                  <Button 
                    onClick={handleSubmitPengajuan}
                    disabled={!selectedEmployee || !retirementCategory}
                    className="min-w-32"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Pengajuan
                  </Button>
                </div>

                {/* Information Card */}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Status Usulan */}
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Usulan Pensiun</CardTitle>
                <CardDescription>
                  Pantau status pengajuan usulan pensiun yang telah disubmit
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingApplications ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="ml-2">Memuat data pengajuan...</span>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belum Ada Pengajuan</h3>
                    <p className="text-muted-foreground mb-4">
                      Anda belum memiliki pengajuan pensiun yang disubmit.
                    </p>
                    <Button onClick={() => setActiveTab("pengajuan")}>
                      <Send className="w-4 h-4 mr-2" />
                      Buat Pengajuan Baru
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <Card key={app.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(app.status)}
                              <div>
                                <h4 className="font-semibold">{app.judul}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Diajukan pada {new Date(app.tanggal_pengajuan).toLocaleDateString('id-ID')}
                                </p>
                              </div>
                            </div>
                            {getApplicationStatusBadge(app.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Nama Pegawai</p>
                              <p className="font-medium">{app.submitter_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Unit Kerja</p>
                              <p className="font-medium">{app.submitter_unit}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Estimasi Proses</p>
                              <p className="font-medium">{app.estimasi}</p>
                            </div>
                          </div>

                          {app.status === 'submitted' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-800">Sedang Menunggu Verifikasi</span>
                              </div>
                              <p className="text-xs text-yellow-700">
                                Pengajuan Anda sedang menunggu verifikasi oleh Admin Pusat. Estimasi waktu verifikasi 3-5 hari kerja.
                              </p>
                            </div>
                          )}

                          {/* Document Verification Status */}
                          <DocumentVerificationStatus 
                            applicationId={app.id}
                            applicationStatus={app.status}
                          />

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Progress:</span>
                              <Progress value={app.progress} className="w-32 h-2" />
                              <span className="text-sm font-medium">{app.progress}%</span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <FileText className="w-3 h-3 mr-1" />
                                Detail
                              </Button>
                              {app.status === 'approved' && (
                                <Button variant="outline" size="sm">
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline Terbaru</CardTitle>
                <CardDescription>
                  Aktivitas terbaru terkait pengajuan pensiun
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.slice(0, 3).map((app) => (
                    <div key={app.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <div className={`p-2 rounded-full ${
                        app.status === 'approved' ? 'bg-green-100' :
                        app.status === 'submitted' ? 'bg-yellow-100' :
                        app.status === 'rejected' ? 'bg-red-100' :
                        'bg-blue-100'
                      }`}>
                        {getStatusIcon(app.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{app.judul}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.submitter_name} • {new Date(app.tanggal_pengajuan).toLocaleDateString('id-ID')}
                        </p>
                        <div className="mt-1">
                          {getApplicationStatusBadge(app.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Generate Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Surat Keterangan</CardTitle>
                <CardDescription>
                  Generate berbagai surat keterangan terkait persiapan pensiun
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="w-6 h-6 text-primary" />
                      <div>
                        <h4 className="font-semibold">Surat Keterangan Masa Kerja</h4>
                        <p className="text-sm text-muted-foreground">Generate surat keterangan masa kerja pegawai</p>
                      </div>
                    </div>
                    <Button className="w-full" disabled>
                      <Download className="w-4 h-4 mr-2" />
                      Generate Surat
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="w-6 h-6 text-primary" />
                      <div>
                        <h4 className="font-semibold">Surat Keterangan Pensiun</h4>
                        <p className="text-sm text-muted-foreground">Generate surat keterangan untuk proses pensiun</p>
                      </div>
                    </div>
                    <Button className="w-full" disabled>
                      <Download className="w-4 h-4 mr-2" />
                      Generate Surat
                    </Button>
                  </Card>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Catatan:</strong> Fitur generate dokumen akan terintegrasi dengan template surat resmi dan 
                    data pegawai dari database untuk menghasilkan surat yang akurat dan sesuai format.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}