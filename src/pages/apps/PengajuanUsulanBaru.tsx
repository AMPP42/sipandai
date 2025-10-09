import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Plus,
  Search,
  User,
  Building,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

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

export default function PengajuanUsulanBaru() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
  const [documentRequirements, setDocumentRequirements] = useState<string[]>([]);

  useEffect(() => {
    loadReferenceData();
    loadEmployees();
    loadPositions();
  }, [user]);

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

      // Load document requirements for mutasi terpadu
      const { data: docs, error: docsError } = await supabase
        .from('document_types')
        .select('name')
        .eq('is_active', true)
        .eq('category', 'mutasi_terpadu')
        .order('name');

      if (docsError) throw docsError;
      setDocumentRequirements(docs?.map(d => d.name) || []);
    } catch (error: any) {
      console.error('Error loading reference data:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      let query = supabase
        .from('employees')
        .select('*')
        .order('nama');

      // If user is admin_unit, filter by their unit
      if (user?.role === 'admin_unit' && user?.unit) {
        query = query.eq('unit', user.unit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data pegawai: ${error.message}`,
        variant: "destructive"
      });
      setEmployees([]);
    }
  };

  const loadPositions = async () => {
    try {
      const { data: positionsData, error } = await supabase
        .from('positions')
        .select('*')
        .order('unit', { ascending: true });

      if (error) throw error;

      const availablePositions = positionsData || [];
      setPositions(availablePositions);

      if (availablePositions.length === 0) {
        toast({
          title: "Peringatan",
          description: "Tidak ada formasi jabatan yang tersedia. Silakan hubungi admin untuk mengisi data formasi.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading positions:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data formasi: ${error.message}`,
        variant: "destructive"
      });
      setPositions([]);
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedEmployee || !selectedPosition || !alasanMutasi.trim()) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua data yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Generate application number
      const currentYear = new Date().getFullYear();
      const { data: existingApps } = await supabase
        .from('applications')
        .select('id')
        .eq('jenis', 'mutasi_terpadu')
        .gte('created_at', `${currentYear}-01-01`);

      const sequence = String(existingApps?.length + 1 || 1).padStart(4, '0');
      const nomorUsulan = `MT/${currentYear}/${sequence}`;

      const applicationData: ApplicationInsert = {
        jenis: 'mutasi_terpadu' as const,
        judul: `Pengajuan Mutasi Terpadu - ${selectedEmployee.nama}`,
        submitter_id: user?.id || '',
        submitter_name: user?.name || '',
        submitter_unit: user?.unit || '',
        status: 'draft' as const,
        estimasi: JSON.stringify({
          employee_id: selectedEmployee.id,
          employee_name: selectedEmployee.nama,
          employee_nip: selectedEmployee.nip,
          unit_asal: selectedEmployee.unit,
          position_id: selectedPosition.id,
          unit_tujuan: selectedPosition.unit,
          jabatan_tujuan: selectedPosition.jabatan,
          alasan_mutasi: alasanMutasi,
          nomor_usulan: nomorUsulan
        })
      };

      const { data: insertedApp, error } = await supabase
        .from('applications')
        .insert(applicationData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Draft pengajuan mutasi terpadu berhasil dibuat. Silakan lengkapi dokumen persyaratan.",
        variant: "default"
      });

      // Navigate to detail page for document upload
      navigate(`/detail-mutasi-terpadu/${insertedApp.id}`);

    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan pengajuan",
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/apps')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Pengajuan Usulan Baru</h1>
          <p className="text-muted-foreground">
            Buat pengajuan mutasi terpadu baru untuk pegawai
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Pengajuan Mutasi Terpadu Baru</CardTitle>
          <CardDescription>
            Lengkapi form di bawah ini untuk membuat pengajuan mutasi terpadu baru
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Employee Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">1. Pilih Pegawai</Label>
            {selectedEmployee ? (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{selectedEmployee.nama}</p>
                        <p className="text-sm text-muted-foreground">
                          NIP: {selectedEmployee.nip} | {selectedEmployee.unit} | {selectedEmployee.jabatan}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedEmployee(null)}>
                      Ubah
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Pilih Pegawai
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Pilih Pegawai</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      <Input
                        placeholder="Cari nama atau NIP..."
                        value={searchEmployee}
                        onChange={(e) => setSearchEmployee(e.target.value)}
                      />
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>NIP</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Jabatan</TableHead>
                            <TableHead>Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEmployees.map((employee) => (
                            <TableRow key={employee.id}>
                              <TableCell className="font-medium">{employee.nama}</TableCell>
                              <TableCell>{employee.nip}</TableCell>
                              <TableCell>{employee.unit}</TableCell>
                              <TableCell>{employee.jabatan}</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEmployee(employee);
                                    setIsEmployeeDialogOpen(false);
                                  }}
                                >
                                  Pilih
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Unit Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">2. Pilih Unit Kerja Tujuan</Label>
            {selectedUnit ? (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{selectedUnit}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedUnit(null)}>
                      Ubah
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Pilih Unit Kerja Tujuan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Pilih Unit Kerja Tujuan</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      <Input
                        placeholder="Cari unit kerja..."
                        value={searchUnit}
                        onChange={(e) => setSearchUnit(e.target.value)}
                      />
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Unit Kerja</TableHead>
                            <TableHead>Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUnits.map((unit, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{unit}</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUnit(unit);
                                    setSelectedPosition(null); // Reset position when unit changes
                                    setIsUnitDialogOpen(false);
                                  }}
                                >
                                  Pilih
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Position Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">3. Pilih Formasi Jabatan Tujuan</Label>
            {selectedPosition ? (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{selectedPosition.jabatan}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPosition.unit} | Kebutuhan: {selectedPosition.kebutuhan} | Gap: {selectedPosition.gap}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedPosition(null)}>
                      Ubah
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Dialog open={isPositionDialogOpen} onOpenChange={setIsPositionDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!selectedUnit || positions.length === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {!selectedUnit ? 'Pilih Unit Kerja Tujuan Terlebih Dahulu' :
                     positions.length === 0 ? 'Tidak Ada Formasi Tersedia' : 'Pilih Formasi Jabatan'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Pilih Formasi Jabatan Tujuan</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      <Input
                        placeholder="Cari unit atau jabatan..."
                        value={searchPosition}
                        onChange={(e) => setSearchPosition(e.target.value)}
                      />
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {filteredPositions.length === 0 ? (
                        <div className="text-center py-8">
                          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-2">
                            {positions.length === 0
                              ? "Tidak ada formasi jabatan yang tersedia"
                              : "Tidak ada formasi jabatan yang cocok dengan filter"}
                          </p>
                          {positions.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              Silakan hubungi admin untuk mengisi data formasi jabatan
                            </p>
                          )}
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Unit</TableHead>
                              <TableHead>Jabatan</TableHead>
                              <TableHead>Existing</TableHead>
                              <TableHead>Kebutuhan</TableHead>
                              <TableHead>Gap</TableHead>
                              <TableHead>Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPositions.map((position) => (
                              <TableRow key={position.id}>
                                <TableCell>{position.unit}</TableCell>
                                <TableCell className="font-medium">{position.jabatan}</TableCell>
                                <TableCell>{position.existing}</TableCell>
                                <TableCell>{position.kebutuhan}</TableCell>
                                <TableCell className="font-medium text-destructive">
                                  {position.gap}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPosition(position);
                                      setIsPositionDialogOpen(false);
                                    }}
                                  >
                                    Pilih
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">4. Alasan Mutasi</Label>
            <Textarea
              placeholder="Jelaskan alasan mengajukan mutasi pegawai..."
              value={alasanMutasi}
              onChange={(e) => setAlasanMutasi(e.target.value)}
              className="min-h-32"
            />
          </div>

          {/* Document Requirements */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">5. Persyaratan Dokumen</Label>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Dokumen yang perlu disiapkan (akan diupload pada tahap selanjutnya):
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {documentRequirements.map((doc, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className="font-medium text-primary min-w-6">
                        {index + 1}.
                      </span>
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedEmployee(null);
                setSelectedUnit(null);
                setSelectedPosition(null);
                setAlasanMutasi('');
              }}
            >
              Reset
            </Button>
            <Button
              onClick={handleSubmitApplication}
              disabled={loading || !selectedEmployee || !selectedUnit || !selectedPosition || !alasanMutasi.trim()}
            >
              {loading ? 'Menyimpan...' : 'Buat Pengajuan'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
