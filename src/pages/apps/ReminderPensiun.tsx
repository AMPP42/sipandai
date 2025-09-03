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
  handphone: string | null;
  email: string | null;
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
  handphone?: string;
  email?: string;
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
  keterangan?: string;
}

interface ChecklistItem {
  id: string;
  nama: string;
  deskripsi: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  deadline?: string;
}

interface DocumentVerificationStatus {
  [key: string]: {
    status: 'approved' | 'needs_fix' | 'pending';
    admin_notes?: string;
    document_name: string;
  };
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
  const [documentVerificationStatus, setDocumentVerificationStatus] = useState<DocumentVerificationStatus>({});
  const [fixedDocuments, setFixedDocuments] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployeesForReminder, setSelectedEmployeesForReminder] = useState<Set<string>>(new Set());
  const [isRemindingSending, setIsRemindingSending] = useState(false);
  const [reminderTemplates, setReminderTemplates] = useState({
    email: "Yth. {nama_pegawai}, Kami informasikan bahwa masa pensiun Anda akan tiba pada {tanggal_pensiun}. Mohon segera melengkapi persyaratan pensiun.",
    sms: "Hai {nama_pegawai}, masa pensiun Anda tinggal {sisa_hari} hari lagi. Segera lengkapi persyaratan pensiun. Info: {kontak_admin}",
    whatsapp: "Halo {nama_pegawai}, ini adalah reminder bahwa masa pensiun Anda akan tiba pada {tanggal_pensiun}. Silakan hubungi admin untuk informasi persyaratan."
  });
  const [enabledChannels, setEnabledChannels] = useState({
    email: true,
    sms: true,
    whatsapp: true
  });
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
      .select('id, nama, nip, tanggal_lahir, tmt_pensiun, unit, jabatan, pangkat, masa_kerja, handphone, email')
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
          statusPersiapan,
          handphone: emp.handphone || '',
          email: emp.email || ''
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
        submitter_unit: app.submitter_unit || 'Tidak diketahui',
        keterangan: app.keterangan
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

      // Load document verification status
      const { data: verificationData, error: verificationError } = await supabase
        .from('document_verifications')
        .select('*, documents(document_index, title)')
        .eq('application_id', applicationId);

      if (verificationError) throw verificationError;

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

      // Populate document verification status
      const verificationStatus: DocumentVerificationStatus = {};
      verificationData.forEach(verification => {
        if (verification.documents && verification.documents.document_index !== null) {
          const docKey = `doc_${verification.documents.document_index}`;
          verificationStatus[docKey] = {
            status: verification.status as 'approved' | 'needs_fix' | 'pending',
            admin_notes: verification.admin_notes || undefined,
            document_name: verification.document_name
          };
        }
      });
      setDocumentVerificationStatus(verificationStatus);

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

  const getApplicationStatusBadge = (status: string, keterangan?: string) => {
    // Check if this is a resubmitted application
    const isResubmitted = keterangan?.includes('Perbaikan - Diajukan Ulang');
    
    if (status === 'submitted' && isResubmitted) {
      return <Badge className="bg-blue-100 text-blue-700">Menunggu Verifikasi Ulang</Badge>;
    }
    
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

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">✓ Disetujui</Badge>;
      case 'needs_fix':
        return <Badge className="bg-red-100 text-red-700">✗ Perlu Diperbaiki</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">⏳ Menunggu</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Belum Diperiksa</Badge>;
    }
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
        "Daftar Susunan Keluarga - pastikan jumlah anak sama dengan di DPCPP (bila anak sudah berkeluarga, tetap dimasukkan saja untuk data)",
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

  const handleMarkDocumentFixed = (docKey: string) => {
    setFixedDocuments(prev => new Set([...prev, docKey]));
    toast({
      title: "Dokumen Ditandai Diperbaiki",
      description: "Dokumen telah ditandai sebagai diperbaiki. Pastikan link sudah diperbarui."
    });
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
      setIsSubmitting(true);
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
            updated_at: new Date().toISOString(),
            progress: 20  // Reset progress for resubmission
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
        // Clear edit state
        setIsEditing(false);
        setEditingApplicationId(null);
        setDocumentVerificationStatus({});
        setFixedDocuments(new Set());
        setSelectedEmployee(null);
        setRetirementCategory("");
        setDocuments({});
        
        // Navigate to status tab and refresh applications
        await fetchApplications();
        setActiveTab("status");
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployeeSelectionForReminder = (employeeId: string, checked: boolean) => {
    setSelectedEmployeesForReminder(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(employeeId);
      } else {
        newSet.delete(employeeId);
      }
      return newSet;
    });
  };

  const generateReminderMessage = (template: string, employee: PensiunData) => {
    return template
      .replace(/{nama_pegawai}/g, employee.nama)
      .replace(/{tanggal_pensiun}/g, new Date(employee.tanggalPensiun).toLocaleDateString('id-ID'))
      .replace(/{sisa_hari}/g, employee.sisaHari.toString())
      .replace(/{kontak_admin}/g, user?.email || 'admin@instansi.go.id');
  };

  // Phone number validation and formatting
  const validateAndFormatPhoneNumber = (phoneNumber: string): { isValid: boolean; formattedNumber: string; error?: string } => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return { isValid: false, formattedNumber: '', error: 'Nomor handphone kosong' };
    }
    
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Check if number starts with 0 (Indonesian format), replace with 62
    let formattedNumber = cleanNumber;
    if (cleanNumber.startsWith('0')) {
      formattedNumber = '62' + cleanNumber.substring(1);
    } else if (!cleanNumber.startsWith('62')) {
      formattedNumber = '62' + cleanNumber;
    }
    
    // Validate Indonesian phone number format (should be 10-15 digits after 62)
    if (formattedNumber.length < 10 || formattedNumber.length > 15) {
      return { isValid: false, formattedNumber, error: 'Format nomor tidak valid' };
    }
    
    return { isValid: true, formattedNumber };
  };

  // Preview WhatsApp link function
  const previewWhatsAppLink = (employee: PensiunData) => {
    const validation = validateAndFormatPhoneNumber(employee.handphone || '');
    if (!validation.isValid) {
      toast({
        title: "Preview Error",
        description: `${employee.nama}: ${validation.error}`,
        variant: "destructive"
      });
      return;
    }
    
    const message = generateReminderMessage(reminderTemplates.whatsapp, employee);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${validation.formattedNumber}?text=${encodedMessage}`;
    
    console.log('WhatsApp Preview:', {
      employee: employee.nama,
      originalNumber: employee.handphone,
      formattedNumber: validation.formattedNumber,
      url: whatsappUrl
    });
    
    toast({
      title: "Preview Link",
      description: `${employee.nama}: wa.me/${validation.formattedNumber}`,
    });
  };

  // Direct WhatsApp reminder function
  const handleDirectWhatsAppReminder = async () => {
    const selectedEmployees = pensiunData.filter(emp => 
      selectedEmployeesForReminder.has(emp.id)
    );

    if (selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Pilih minimal satu pegawai untuk mengirim reminder WhatsApp",
        variant: "destructive"
      });
      return;
    }

    // Validate all phone numbers first
    const validEmployees = [];
    const invalidEmployees = [];
    
    selectedEmployees.forEach(employee => {
      const validation = validateAndFormatPhoneNumber(employee.handphone || '');
      if (validation.isValid) {
        validEmployees.push({ ...employee, formattedNumber: validation.formattedNumber });
      } else {
        invalidEmployees.push({ employee, error: validation.error });
      }
    });

    // Show errors for invalid numbers
    if (invalidEmployees.length > 0) {
      const errorMessage = invalidEmployees.map(item => 
        `${item.employee.nama}: ${item.error}`
      ).join('\n');
      
      toast({
        title: "Nomor Tidak Valid",
        description: `${invalidEmployees.length} pegawai memiliki nomor tidak valid. Periksa console untuk detail.`,
        variant: "destructive"
      });
      
      console.error('Invalid phone numbers:', invalidEmployees);
    }

    if (validEmployees.length === 0) {
      return;
    }

    // Confirm batch sending
    const shouldProceed = window.confirm(
      `Akan membuka ${validEmployees.length} tab WhatsApp. Pastikan popup blocker dinonaktifkan. Lanjutkan?`
    );
    
    if (!shouldProceed) return;

    // Open WhatsApp links with delay to avoid popup blocker
    for (let i = 0; i < validEmployees.length; i++) {
      const employee = validEmployees[i];
      const message = generateReminderMessage(reminderTemplates.whatsapp, employee);
      const encodedMessage = encodeURIComponent(message);
      
      // Use wa.me format as recommended by WhatsApp (not API format)
      const whatsappUrl = `https://wa.me/${employee.formattedNumber}?text=${encodedMessage}`;
      
      console.log('WhatsApp URL Generated:', {
        employee: employee.nama,
        number: employee.formattedNumber,
        url: whatsappUrl,
        message: message
      });
      
      // Open in new window/tab
      window.open(whatsappUrl, '_blank');
      
      // Add delay between opens to avoid popup blocker (except for last one)
      if (i < validEmployees.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    toast({
      title: "WhatsApp Links Dibuka",
      description: `${validEmployees.length} link WhatsApp berhasil dibuka${invalidEmployees.length > 0 ? `, ${invalidEmployees.length} gagal karena nomor tidak valid` : ''}.`
    });
  };

  // Direct Email reminder function  
  const handleDirectEmailReminder = () => {
    const selectedEmployees = pensiunData.filter(emp => 
      selectedEmployeesForReminder.has(emp.id)
    );

    const adminEmail = "primastiwardani93@gmail.com";
    
    selectedEmployees.forEach(employee => {
      // Assume employee has email field, if not we'll use a placeholder
      const employeeEmail = employee.email || "employee@example.com"; // Fallback email
      const subject = encodeURIComponent(`Reminder Pensiun - ${employee.nama}`);
      const body = encodeURIComponent(generateReminderMessage(reminderTemplates.email, employee));
      
      // Create mailto link
      const mailtoUrl = `mailto:${employeeEmail}?subject=${subject}&body=${body}&from=${adminEmail}`;
      
      // Open email client
      window.location.href = mailtoUrl;
    });

    toast({
      title: "Email Client Dibuka",
      description: `Email client dibuka untuk ${selectedEmployees.length} pegawai. Silakan kirim email.`
    });
  };

  const simulateNotificationSending = async () => {
    setIsRemindingSending(true);
    
    try {
      const selectedEmployees = pensiunData.filter(emp => 
        selectedEmployeesForReminder.has(emp.id)
      );

      if (selectedEmployees.length === 0) {
        toast({
          title: "Error",
          description: "Pilih minimal satu pegawai untuk dikirim reminder",
          variant: "destructive"
        });
        return;
      }

      // Simulate delay for sending process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Log notification activity (in real implementation, this would go to database)
      const notificationLog = selectedEmployees.map(employee => {
        const channels = [];
        if (enabledChannels.email) channels.push('Email');
        if (enabledChannels.sms) channels.push('SMS');
        if (enabledChannels.whatsapp) channels.push('WhatsApp');

        return {
          employee_id: employee.id,
          employee_name: employee.nama,
          employee_nip: employee.nip,
          channels_sent: channels,
          messages: {
            email: enabledChannels.email ? generateReminderMessage(reminderTemplates.email, employee) : null,
            sms: enabledChannels.sms ? generateReminderMessage(reminderTemplates.sms, employee) : null,
            whatsapp: enabledChannels.whatsapp ? generateReminderMessage(reminderTemplates.whatsapp, employee) : null
          },
          sent_at: new Date().toISOString(),
          status: 'simulated' // In real implementation: 'sent', 'failed', etc.
        };
      });

      // Here you would normally save to database
      console.log('Notification Log:', notificationLog);

      // Create notifications in database for audit trail
      for (const employee of selectedEmployees) {
        const channels = [];
        if (enabledChannels.email) channels.push('Email');
        if (enabledChannels.sms) channels.push('SMS');
        if (enabledChannels.whatsapp) channels.push('WhatsApp');

        await supabase
          .from('notifications')
          .insert({
            recipient_id: user?.id, // In real implementation, this would be employee's user_id
            title: `Reminder Pensiun - ${employee.nama}`,
            body: `Notifikasi reminder pensiun telah dikirim via ${channels.join(', ')} kepada ${employee.nama} (${employee.nip}). Sisa waktu pensiun: ${formatSisaWaktu(employee.sisaHari)}`
          });
      }

      toast({
        title: "Reminder Berhasil Dikirim!",
        description: `Notifikasi reminder pensiun telah dikirim kepada ${selectedEmployees.length} pegawai melalui ${Object.entries(enabledChannels).filter(([_, enabled]) => enabled).map(([channel]) => channel).join(', ')}`
      });

      // Clear selection after sending
      setSelectedEmployeesForReminder(new Set());

      // Show detailed preview of what was sent
      const previewMessage = selectedEmployees.map(emp => 
        `📧 ${emp.nama} (${emp.nip}): ${formatSisaWaktu(emp.sisaHari)} lagi`
      ).join('\n');

      console.log('Preview notifikasi yang dikirim:\n', previewMessage);

    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim reminder. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsRemindingSending(false);
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
            <TabsTrigger value="reminder" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Reminder Pensiun
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

                  {/* Edit Mode Summary */}
                  {isEditing && Object.keys(documentVerificationStatus).length > 0 && (
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-orange-900 mb-2">Ringkasan Status Verifikasi</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-700">✓ Disetujui</Badge>
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
                        {Object.values(documentVerificationStatus).some(v => v.status === 'needs_fix') && (
                          <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                            <p className="text-sm font-medium text-red-900">
                              Fokus pada dokumen yang perlu diperbaiki. Pastikan untuk menekan tombol "Perbaiki" setelah mengupdate link dokumen.
                            </p>
                          </div>
                        )}
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
                        {isEditing ? 'Edit Dokumen Persyaratan' : 'Dokumen Persyaratan'} - {retirementCategories[retirementCategory as keyof typeof retirementCategories].label}
                      </CardTitle>
                      <CardDescription>
                        {isEditing 
                          ? 'Perbaiki dokumen yang bermasalah sesuai catatan reviewer. Dokumen yang sudah disetujui tidak perlu diubah.'
                          : 'Silakan upload link Google Drive untuk setiap dokumen yang diperlukan'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {isEditing && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-blue-900 mb-2">Panduan Edit Dokumen</h4>
                            <div className="text-sm text-blue-800 space-y-1">
                              <p>• <span className="font-medium text-green-700">✓ Disetujui</span>: Dokumen sudah benar, tidak perlu diubah</p>
                              <p>• <span className="font-medium text-red-700">✗ Perlu Diperbaiki</span>: Dokumen harus diperbaiki dan diupload ulang</p>
                              <p>• <span className="font-medium text-yellow-700">⏳ Menunggu</span>: Dokumen belum diperiksa</p>
                            </div>
                          </div>
                        )}
                        
                        {retirementCategories[retirementCategory as keyof typeof retirementCategories].documents.map((doc, index) => {
                          const docKey = `doc_${index}`;
                          const verificationStatus = documentVerificationStatus[docKey];
                          const needsAttention = isEditing && verificationStatus?.status === 'needs_fix';
                          const isApproved = verificationStatus?.status === 'approved';
                          const isFixed = fixedDocuments.has(docKey);
                          
                          // In edit mode, only show documents that need fixing or are new
                          if (isEditing && isApproved) {
                            return (
                              <div key={index} className="space-y-2 bg-green-50 border border-green-200 rounded-lg p-3 opacity-75">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium text-green-800">
                                    {index + 1}. {doc}
                                  </Label>
                                  {getVerificationStatusBadge(verificationStatus.status)}
                                </div>
                                <p className="text-xs text-green-700">Dokumen sudah disetujui, tidak perlu diubah</p>
                              </div>
                            );
                          }
                          
                          return (
                            <div key={index} className={`space-y-2 ${needsAttention ? 'bg-red-50 border border-red-200 rounded-lg p-3' : ''} ${isFixed ? 'bg-blue-50 border border-blue-200' : ''}`}>
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`doc-${index}`} className={`text-sm font-medium ${needsAttention ? 'text-red-800' : isFixed ? 'text-blue-800' : ''}`}>
                                  {index + 1}. {doc}
                                </Label>
                                <div className="flex items-center gap-2">
                                  {verificationStatus && getVerificationStatusBadge(verificationStatus.status)}
                                  {isFixed && <Badge className="bg-blue-100 text-blue-700">✓ Diperbaiki</Badge>}
                                </div>
                              </div>
                              
                              {verificationStatus?.admin_notes && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                  <p className="text-xs font-medium text-yellow-800">Catatan Admin:</p>
                                  <p className="text-xs text-yellow-700">{verificationStatus.admin_notes}</p>
                                </div>
                              )}
                              
                              <div className="flex gap-2">
                                <Input
                                  id={`doc-${index}`}
                                  placeholder="Masukkan link Google Drive dokumen..."
                                  value={documents[docKey] || ""}
                                  onChange={(e) => handleDocumentChange(index, e.target.value)}
                                  className={needsAttention ? 'border-red-300 focus:border-red-500' : isFixed ? 'border-blue-300 focus:border-blue-500' : ''}
                                />
                                <Button variant="outline" size="icon">
                                  <Upload className="w-4 h-4" />
                                </Button>
                                {needsAttention && !isFixed && documents[docKey] && (
                                  <Button 
                                    onClick={() => handleMarkDocumentFixed(docKey)}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                                  >
                                    Perbaiki
                                  </Button>
                                )}
                              </div>
                              
                              {isFixed && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                  <p className="text-xs font-medium text-blue-800">✓ Dokumen telah diperbaiki</p>
                                  <p className="text-xs text-blue-700">Dokumen ini telah ditandai sebagai diperbaiki dan siap untuk direview ulang.</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
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
                    disabled={!selectedEmployee || !retirementCategory || isSubmitting}
                    className="min-w-32"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isEditing ? 'Mengirim Perbaikan...' : 'Mengirim...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {isEditing ? 'Submit Perbaikan' : 'Submit Pengajuan'}
                      </>
                    )}
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
                            {getApplicationStatusBadge(app.status, app.keterangan)}
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

                          {app.status === 'submitted' && app.keterangan?.includes('Perbaikan - Diajukan Ulang') && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Perbaikan Sedang Diverifikasi Ulang</span>
                              </div>
                              <p className="text-xs text-blue-700">
                                Perbaikan Anda telah diterima dan sedang menunggu verifikasi ulang oleh Admin Pusat. 
                                Estimasi waktu verifikasi 3-5 hari kerja.
                              </p>
                            </div>
                          )}

                          {app.status === 'submitted' && !app.keterangan?.includes('Perbaikan - Diajukan Ulang') && (
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

                          {app.status === 'revision_needed' && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                <span className="text-sm font-medium text-orange-800">Perlu Revisi</span>
                              </div>
                              <p className="text-xs text-orange-700 mb-3">
                                Pengajuan Anda perlu diperbaiki sesuai catatan dari Admin Pusat. Silakan edit dan ajukan ulang.
                              </p>
                              <Button 
                                onClick={() => {
                                  // Navigate to edit mode
                                  navigate(`/apps/reminder-pensiun?edit=${app.id}`);
                                }}
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Edit & Ajukan Ulang
                              </Button>
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
                              {app.status === 'revision_needed' && (
                                <Button 
                                  onClick={() => {
                                    navigate(`/apps/reminder-pensiun?edit=${app.id}`);
                                  }}
                                  size="sm"
                                  className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              )}
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
                          {getApplicationStatusBadge(app.status, app.keterangan)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Reminder Pensiun */}
          <TabsContent value="reminder" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reminder Pensiun Otomatis</CardTitle>
                <CardDescription>
                  Kirim notifikasi otomatis ke pegawai yang mendekati masa pensiun via WhatsApp, SMS, dan Email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filter Pegawai Mendekati Pensiun */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      <div>
                        <h4 className="font-semibold text-red-900">Urgen (≤3 bulan)</h4>
                        <p className="text-sm text-red-700">{pensiunData.filter(p => p.sisaHari <= 90).length} pegawai</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-6 h-6 text-yellow-600" />
                      <div>
                        <h4 className="font-semibold text-yellow-900">Perlu Perhatian (≤1 tahun)</h4>
                        <p className="text-sm text-yellow-700">{pensiunData.filter(p => p.sisaHari <= 365 && p.sisaHari > 90).length} pegawai</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Bell className="w-6 h-6 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-blue-900">Siap Reminder</h4>
                        <p className="text-sm text-blue-700">{pensiunData.filter(p => p.sisaHari <= 365).length} pegawai</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Daftar Pegawai untuk Reminder */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pilih Pegawai untuk Dikirim Reminder</CardTitle>
                    <CardDescription>
                      Centang pegawai yang akan dikirim notifikasi reminder pensiun
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pensiunData.filter(p => p.sisaHari <= 365).map((pegawai) => (
                        <div key={pegawai.id} className={`p-4 border rounded-lg ${pegawai.sisaHari <= 90 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`reminder-${pegawai.id}`}
                                checked={selectedEmployeesForReminder.has(pegawai.id)}
                                onChange={(e) => handleEmployeeSelectionForReminder(pegawai.id, e.target.checked)}
                                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                              />
                              <div>
                                <h4 className="font-semibold">{pegawai.nama}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {pegawai.nip} • {pegawai.unitKerja} • {pegawai.jabatan}
                                </p>
                                <p className="text-sm font-medium text-primary">
                                  Sisa waktu: {formatSisaWaktu(pegawai.sisaHari)}
                                </p>
                              </div>
                            </div>
                      <div className="text-right">
                        {pegawai.sisaHari <= 90 && (
                          <Badge className="bg-red-100 text-red-700 mb-2">URGEN</Badge>
                        )}
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>📧 Email: {pegawai.email || 'Tidak tersedia'}</p>
                          <p>📱 HP: {pegawai.handphone || 'Tidak tersedia'}</p>
                          <div className="flex gap-1">
                            <span>💬 WhatsApp:</span>
                            {pegawai.handphone ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-5 px-2 text-xs"
                                onClick={() => previewWhatsAppLink(pegawai)}
                              >
                                Preview
                              </Button>
                            ) : (
                              <span>Tidak tersedia</span>
                            )}
                          </div>
                        </div>
                      </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Template Notifikasi */}
                <Card>
                  <CardHeader>
                    <CardTitle>Template Notifikasi</CardTitle>
                    <CardDescription>
                      Pilih template dan metode pengiriman notifikasi
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>
                          <input 
                            type="checkbox" 
                            className="mr-2" 
                            checked={enabledChannels.email}
                            onChange={(e) => setEnabledChannels(prev => ({...prev, email: e.target.checked}))}
                          />
                          📧 Email
                        </Label>
                        <Textarea 
                          placeholder="Template email notifikasi pensiun..."
                          className="h-24"
                          value={reminderTemplates.email}
                          onChange={(e) => setReminderTemplates(prev => ({...prev, email: e.target.value}))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>
                          <input 
                            type="checkbox" 
                            className="mr-2" 
                            checked={enabledChannels.sms}
                            onChange={(e) => setEnabledChannels(prev => ({...prev, sms: e.target.checked}))}
                          />
                          📱 SMS
                        </Label>
                        <Textarea 
                          placeholder="Template SMS notifikasi pensiun..."
                          className="h-24"
                          value={reminderTemplates.sms}
                          onChange={(e) => setReminderTemplates(prev => ({...prev, sms: e.target.value}))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>
                          <input 
                            type="checkbox" 
                            className="mr-2" 
                            checked={enabledChannels.whatsapp}
                            onChange={(e) => setEnabledChannels(prev => ({...prev, whatsapp: e.target.checked}))}
                          />
                          💬 WhatsApp
                        </Label>
                        <Textarea 
                          placeholder="Template WhatsApp notifikasi pensiun..."
                          className="h-24"
                          value={reminderTemplates.whatsapp}
                          onChange={(e) => setReminderTemplates(prev => ({...prev, whatsapp: e.target.value}))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    <p>💡 <strong>Tips:</strong> Gunakan variabel {`{nama_pegawai}, {tanggal_pensiun}, {sisa_hari}, {kontak_admin}`} dalam template</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline">
                      <Clock className="w-4 h-4 mr-2" />
                      Jadwalkan Otomatis
                    </Button>
                    <Button 
                      onClick={() => handleDirectWhatsAppReminder()}
                      disabled={selectedEmployeesForReminder.size === 0 || !enabledChannels.whatsapp}
                      variant="outline"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Kirim via WhatsApp ({selectedEmployeesForReminder.size})
                    </Button>
                    <Button 
                      onClick={() => handleDirectEmailReminder()}
                      disabled={selectedEmployeesForReminder.size === 0 || !enabledChannels.email}
                      variant="outline"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Kirim via Email ({selectedEmployeesForReminder.size})
                    </Button>
                  </div>
                </div>

                {/* Info Card */}
                {/* Preview Selected Employees */}
                {selectedEmployeesForReminder.size > 0 && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-green-900 mb-2">
                        Preview Reminder ({selectedEmployeesForReminder.size} pegawai terpilih)
                      </h4>
                      <div className="space-y-2 text-sm text-green-800">
                        {pensiunData
                          .filter(emp => selectedEmployeesForReminder.has(emp.id))
                          .map(emp => (
                            <div key={emp.id} className="flex justify-between">
                              <span>📧 {emp.nama} ({emp.nip})</span>
                              <span className="font-medium">{formatSisaWaktu(emp.sisaHari)} lagi</span>
                            </div>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Mode Simulasi Aktif</h4>
                        <p className="text-sm text-blue-800 mb-2">
                          Saat ini sistem berjalan dalam mode simulasi. Notifikasi akan dicatat dalam sistem tanpa mengirim pesan sebenarnya.
                          Untuk implementasi nyata, diperlukan integrasi dengan:
                        </p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>• 📧 <strong>Email:</strong> Resend API / SMTP Server</li>
                          <li>• 📱 <strong>SMS:</strong> Twilio / AWS SNS / Local SMS Gateway</li>
                          <li>• 💬 <strong>WhatsApp:</strong> WhatsApp Business API / Fonnte</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}