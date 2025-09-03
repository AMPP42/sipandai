import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Clock, 
  Bell, 
  FileText,
  User,
  AlertTriangle,
  CheckCircle,
  Download,
  Search
} from "lucide-react";

interface PensiunData {
  id: string;
  nama: string;
  nip: string;
  tanggalLahir: string;
  tanggalPensiun: string;
  sisaHari: number;
  unitKerja: string;
  jabatan: string;
  statusPersiapan: 'belum_mulai' | 'dalam_proses' | 'hampir_selesai' | 'siap';
  dokumenLengkap: boolean;
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

  // Mock data for demonstration
  const pensiunData: PensiunData[] = [
    {
      id: "1",
      nama: "Drs. H. Bambang Sutrisno, M.M.",
      nip: "196401051990031001",
      tanggalLahir: "1964-01-05",
      tanggalPensiun: "2024-01-05",
      sisaHari: 45,
      unitKerja: "Biro Kepegawaian",
      jabatan: "Kepala Bidang Mutasi",
      statusPersiapan: "dalam_proses",
      dokumenLengkap: false
    },
    {
      id: "2",
      nama: "Hj. Siti Maryam, S.E., M.M.",
      nip: "196203151987032001",
      tanggalLahir: "1962-03-15",
      tanggalPensiun: "2024-06-15",
      sisaHari: 180,
      unitKerja: "Inspektorat",
      jabatan: "Auditor Madya",
      statusPersiapan: "belum_mulai",
      dokumenLengkap: false
    },
    {
      id: "3",
      nama: "Ir. Abdul Rahman, M.T.",
      nip: "196109101985031002",
      tanggalLahir: "1961-09-10",
      tanggalPensiun: "2025-03-10",
      sisaHari: 420,
      unitKerja: "Biro Perencanaan",
      jabatan: "Perencana Ahli Madya",
      statusPersiapan: "hampir_selesai",
      dokumenLengkap: true
    }
  ];

  const checklistPersiapan: ChecklistItem[] = [
    {
      id: "1",
      nama: "Surat Permohonan Pensiun",
      deskripsi: "Mengajukan surat permohonan pensiun kepada atasan langsung",
      completed: true,
      priority: "high",
      deadline: "3 bulan sebelum TMT Pensiun"
    },
    {
      id: "2",
      nama: "Penyelesaian Tugas & Tanggungjawab",
      deskripsi: "Menyelesaikan semua tugas dan tanggung jawab yang sedang berjalan",
      completed: true,
      priority: "high"
    },
    {
      id: "3",
      nama: "Serah Terima Jabatan",
      deskripsi: "Melakukan serah terima jabatan kepada pejabat pengganti",
      completed: false,
      priority: "high",
      deadline: "1 bulan sebelum TMT Pensiun"
    },
    {
      id: "4",
      nama: "Kliring Administrasi",
      deskripsi: "Menyelesaikan kliring dengan berbagai unit terkait",
      completed: false,
      priority: "medium"
    },
    {
      id: "5",
      nama: "Penyelesaian Keuangan",
      deskripsi: "Menyelesaikan semua urusan keuangan dan gaji",
      completed: false,
      priority: "medium"
    },
    {
      id: "6",
      nama: "Surat Keterangan Pensiun",
      deskripsi: "Mengurus surat keterangan pensiun dari BKN",
      completed: false,
      priority: "high",
      deadline: "2 minggu sebelum TMT Pensiun"
    }
  ];

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
            <Badge className="bg-red-100 text-red-700">
              {pensiunData.filter(p => p.sisaHari <= 90).length} Urgen (≤3 bulan)
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-700">
              {pensiunData.filter(p => p.sisaHari <= 365 && p.sisaHari > 90).length} Perlu Perhatian (≤1 tahun)
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Dashboard Countdown
            </TabsTrigger>
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Checklist Persiapan
            </TabsTrigger>
            <TabsTrigger value="reminder" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Auto Reminder
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                            <p className="text-muted-foreground">TMT Pensiun</p>
                            <p className="font-medium">
                              {new Date(pegawai.tanggalPensiun).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary mb-1">
                          {formatSisaWaktu(pegawai.sisaHari)}
                        </div>
                        <Progress 
                          value={Math.max(0, 100 - (pegawai.sisaHari / 730) * 100)} 
                          className="w-24 h-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Progress ke pensiun
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: Checklist Preparation */}
          <TabsContent value="checklist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Checklist Persiapan Pensiun</CardTitle>
                <CardDescription>
                  Panduan langkah-langkah persiapan pensiun yang harus diselesaikan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Progress Keseluruhan</h3>
                      <p className="text-sm text-muted-foreground">
                        {checklistPersiapan.filter(item => item.completed).length} dari {checklistPersiapan.length} langkah selesai
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {hitungProgressPersiapan(checklistPersiapan)}%
                      </p>
                      <Progress value={hitungProgressPersiapan(checklistPersiapan)} className="w-32 h-2" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {checklistPersiapan.map((item) => (
                      <Card key={item.id} className={`border ${item.completed ? 'bg-green-50 border-green-200' : 'border-border'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {item.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                            ) : (
                              <Clock className={`w-5 h-5 ${getPriorityColor(item.priority)} mt-0.5`} />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{item.nama}</h4>
                                <Badge 
                                  className={
                                    item.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }
                                >
                                  {item.priority === 'high' ? 'Prioritas Tinggi' :
                                   item.priority === 'medium' ? 'Prioritas Sedang' :
                                   'Prioritas Rendah'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{item.deskripsi}</p>
                              {item.deadline && (
                                <p className="text-xs text-muted-foreground">
                                  <strong>Deadline:</strong> {item.deadline}
                                </p>
                              )}
                            </div>
                            <Button 
                              variant={item.completed ? "outline" : "default"}
                              size="sm"
                            >
                              {item.completed ? "Selesai" : "Tandai Selesai"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Auto Reminder */}
          <TabsContent value="reminder" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sistem Auto Reminder</CardTitle>
                <CardDescription>
                  Konfigurasi reminder otomatis untuk persiapan pensiun pegawai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sistem Reminder Segera Hadir</h3>
                  <p className="text-muted-foreground mb-4">
                    Fitur auto-reminder akan mengirimkan notifikasi email dan SMS berdasarkan timeline pensiun.
                  </p>
                  <Button disabled>
                    Konfigurasi Reminder
                  </Button>
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