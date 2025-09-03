import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Download,
  Plus,
  Search,
  Filter
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UsulanMutasi {
  id: string;
  nomorUsulan: string;
  namaPegawai: string;
  nip: string;
  unitAsal: string;
  unitTujuan: string;
  jenisMutasi: string;
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'revision_needed';
  tanggalUsulan: string;
  dokumenLengkap: boolean;
}

export default function PengajuanMutasi() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("create");
  const [formData, setFormData] = useState({
    namaPegawai: "",
    nip: "",
    unitAsal: "",
    unitTujuan: "",
    jenisMutasi: "",
    alasanMutasi: "",
    dokumenLink: ""
  });

  // Mock data for demonstration
  const usulanList: UsulanMutasi[] = [
    {
      id: "1",
      nomorUsulan: "MUT/2024/0001",
      namaPegawai: "Dr. Ahmad Fauzi, S.H., M.H.",
      nip: "196508121990031001",
      unitAsal: "Biro Hukum",
      unitTujuan: "Inspektorat Jenderal",
      jenisMutasi: "Rotasi",
      status: "in_review",
      tanggalUsulan: "2024-01-15",
      dokumenLengkap: true
    },
    {
      id: "2", 
      nomorUsulan: "MUT/2024/0002",
      namaPegawai: "Siti Nurhaliza, S.E., M.M.",
      nip: "197203101995032002",
      unitAsal: "Biro Keuangan",
      unitTujuan: "Sekretariat Jenderal",
      jenisMutasi: "Promosi",
      status: "approved",
      tanggalUsulan: "2024-01-10",
      dokumenLengkap: true
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
      submitted: { label: "Diajukan", className: "bg-blue-100 text-blue-700" },
      in_review: { label: "Sedang Ditinjau", className: "bg-yellow-100 text-yellow-700" },
      approved: { label: "Disetujui", className: "bg-green-100 text-green-700" },
      rejected: { label: "Ditolak", className: "bg-red-100 text-red-700" },
      revision_needed: { label: "Perlu Revisi", className: "bg-orange-100 text-orange-700" }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log("Form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Pengajuan Berkas Usulan Mutasi
            </h1>
            <p className="text-muted-foreground mt-2">
              Sistem pengajuan mutasi pegawai dengan tracking timeline dan notifikasi real-time
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-primary/10 text-primary">
              {usulanList.length} Total Usulan
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-700">
              {usulanList.filter(u => u.status === 'in_review').length} Sedang Ditinjau
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Buat Usulan Baru
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Daftar Usulan
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tracking Status
            </TabsTrigger>
          </TabsList>

          {/* Tab: Create New Proposal */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Form Pengajuan Usulan Mutasi</CardTitle>
                <CardDescription>
                  Lengkapi form di bawah ini untuk mengajukan usulan mutasi pegawai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Data Pegawai */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Data Pegawai</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="namaPegawai">Nama Pegawai *</Label>
                        <Select value={formData.namaPegawai} onValueChange={(value) => setFormData({...formData, namaPegawai: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih pegawai dari database" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dr. Ahmad Fauzi, S.H., M.H.">Dr. Ahmad Fauzi, S.H., M.H.</SelectItem>
                            <SelectItem value="Siti Nurhaliza, S.E., M.M.">Siti Nurhaliza, S.E., M.M.</SelectItem>
                            <SelectItem value="Budi Santoso, S.T., M.T.">Budi Santoso, S.T., M.T.</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nip">NIP *</Label>
                        <Input
                          id="nip"
                          value={formData.nip}
                          onChange={(e) => setFormData({...formData, nip: e.target.value})}
                          placeholder="196508121990031001"
                          readOnly
                          className="bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unitAsal">Unit Kerja Asal *</Label>
                        <Input
                          id="unitAsal"
                          value={formData.unitAsal}
                          onChange={(e) => setFormData({...formData, unitAsal: e.target.value})}
                          placeholder="Akan terisi otomatis"
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    {/* Data Mutasi */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Data Mutasi</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="unitTujuan">Unit Kerja Tujuan *</Label>
                        <Select value={formData.unitTujuan} onValueChange={(value) => setFormData({...formData, unitTujuan: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih unit kerja tujuan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inspektorat Jenderal">Inspektorat Jenderal</SelectItem>
                            <SelectItem value="Sekretariat Jenderal">Sekretariat Jenderal</SelectItem>
                            <SelectItem value="Biro Hukum">Biro Hukum</SelectItem>
                            <SelectItem value="Biro Keuangan">Biro Keuangan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="jenisMutasi">Jenis Mutasi *</Label>
                        <Select value={formData.jenisMutasi} onValueChange={(value) => setFormData({...formData, jenisMutasi: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis mutasi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Rotasi">Rotasi</SelectItem>
                            <SelectItem value="Promosi">Promosi</SelectItem>
                            <SelectItem value="Demosi">Demosi</SelectItem>
                            <SelectItem value="Mutasi Reguler">Mutasi Reguler</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="alasanMutasi">Alasan Mutasi *</Label>
                        <Textarea
                          id="alasanMutasi"
                          value={formData.alasanMutasi}
                          onChange={(e) => setFormData({...formData, alasanMutasi: e.target.value})}
                          placeholder="Jelaskan alasan pengajuan mutasi..."
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dokumen Persyaratan */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Dokumen Persyaratan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Upload className="w-5 h-5 text-primary" />
                          <div>
                            <h4 className="font-medium">Upload ke Google Drive</h4>
                            <p className="text-sm text-muted-foreground">Share link folder dengan dokumen lengkap</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dokumenLink">Link Google Drive *</Label>
                          <Input
                            id="dokumenLink"
                            value={formData.dokumenLink}
                            onChange={(e) => setFormData({...formData, dokumenLink: e.target.value})}
                            placeholder="https://drive.google.com/drive/folders/..."
                          />
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h4 className="font-medium mb-3">Checklist Dokumen:</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Surat Permohonan Mutasi</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Fotocopy SK Terakhir</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            <span>DP3/SKP 2 Tahun Terakhir</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            <span>Surat Rekomendasi Atasan</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1">
                      Simpan Sebagai Draft
                    </Button>
                    <Button type="button" variant="outline" className="flex-1">
                      Submit Usulan
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: List of Proposals */}
          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Daftar Usulan Mutasi</CardTitle>
                    <CardDescription>Kelola dan pantau semua usulan mutasi yang telah diajukan</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usulanList.map((usulan) => (
                    <Card key={usulan.id} className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-foreground">{usulan.nomorUsulan}</h3>
                              {getStatusBadge(usulan.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Nama Pegawai</p>
                                <p className="font-medium">{usulan.namaPegawai}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">NIP</p>
                                <p className="font-mono">{usulan.nip}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Unit Asal → Tujuan</p>
                                <p className="font-medium">{usulan.unitAsal} → {usulan.unitTujuan}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Jenis Mutasi</p>
                                <p className="font-medium">{usulan.jenisMutasi}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              Detail
                            </Button>
                            {usulan.status === 'draft' && (
                              <Button size="sm">
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Status Tracking */}
          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tracking Status Usulan</CardTitle>
                <CardDescription>Pantau progress dan timeline pengajuan mutasi secara real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {usulanList.map((usulan) => (
                    <Card key={usulan.id} className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-foreground">{usulan.nomorUsulan}</h3>
                            <p className="text-sm text-muted-foreground">{usulan.namaPegawai}</p>
                          </div>
                          {getStatusBadge(usulan.status)}
                        </div>
                        
                        {/* Timeline */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="font-medium text-sm">Usulan Diajukan</p>
                              <p className="text-xs text-muted-foreground">{usulan.tanggalUsulan}</p>
                            </div>
                          </div>
                          
                          {usulan.status !== 'draft' && (
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-blue-500" />
                              <div>
                                <p className="font-medium text-sm">Sedang Ditinjau Admin Pusat</p>
                                <p className="text-xs text-muted-foreground">Menunggu verifikasi dokumen</p>
                              </div>
                            </div>
                          )}
                          
                          {usulan.status === 'approved' && (
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <div>
                                <p className="font-medium text-sm">Usulan Disetujui</p>
                                <p className="text-xs text-muted-foreground">Proses dapat dilanjutkan</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}