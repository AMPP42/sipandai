
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePicker } from '@/components/ui/date-picker';
import { X, Save, UserPlus } from 'lucide-react';
import { employeeFormSchema, sanitizeText, sanitizeFilename } from '@/lib/validation';
import { getUserFriendlyError } from '@/lib/security';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

interface Employee {
  id?: string;
  nama: string;
  nip?: string;
  nik?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: 'L' | 'P';
  agama?: string;
  status_pernikahan?: string;
  pendidikan_terakhir?: string;
  handphone?: string;
  email?: string;
  alamat?: string;
  unit?: string; // Use 'unit' to match existing database
  kriteria_asn?: string;
  jabatan?: string; // Use 'jabatan' to match existing database
  grade_kelas_jabatan?: string;
  tmt_jabatan_terakhir?: string;
  pangkat?: string; // Use 'pangkat' to match existing database
  tmt_pangkat_terakhir?: string;
  tmt_cpns?: string;
  tmt_pns?: string;
  tmt_pensiun?: string;
  masa_kerja?: string;
  created_at?: string;
  updated_at?: string;
}

interface EmployeeFormProps {
  employee?: Employee | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function EmployeeForm({ employee, onSave, onCancel }: EmployeeFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [unitOptions, setUnitOptions] = useState<Array<{ id: string; nama_unit: string }>>([]);
  const [pangkatOptions] = useState([
    // Golongan I (Juru)
    { id: '1', kode: 'I/a', nama_pangkat: 'Juru Muda' },
    { id: '2', kode: 'I/b', nama_pangkat: 'Juru Muda Tingkat I' },
    { id: '3', kode: 'I/c', nama_pangkat: 'Juru' },
    { id: '4', kode: 'I/d', nama_pangkat: 'Juru Tingkat I' },
    // Golongan II (Pengatur)
    { id: '5', kode: 'II/a', nama_pangkat: 'Pengatur Muda' },
    { id: '6', kode: 'II/b', nama_pangkat: 'Pengatur Muda Tingkat I' },
    { id: '7', kode: 'II/c', nama_pangkat: 'Pengatur' },
    { id: '8', kode: 'II/d', nama_pangkat: 'Pengatur Tingkat I' },
    // Golongan III (Penata)
    { id: '9', kode: 'III/a', nama_pangkat: 'Penata Muda' },
    { id: '10', kode: 'III/b', nama_pangkat: 'Penata Muda Tingkat I' },
    { id: '11', kode: 'III/c', nama_pangkat: 'Penata' },
    { id: '12', kode: 'III/d', nama_pangkat: 'Penata Tingkat I' },
    // Golongan IV (Pembina)
    { id: '13', kode: 'IV/a', nama_pangkat: 'Pembina' },
    { id: '14', kode: 'IV/b', nama_pangkat: 'Pembina Tingkat I' },
    { id: '15', kode: 'IV/c', nama_pangkat: 'Pembina Utama Muda' },
    { id: '16', kode: 'IV/d', nama_pangkat: 'Pembina Utama Madya' },
    { id: '17', kode: 'IV/e', nama_pangkat: 'Pembina Utama' },
    // Pangkat Golongan PPPK
    { id: '18', kode: 'III', nama_pangkat: 'PPPK Golongan III' },
    { id: '19', kode: 'V', nama_pangkat: 'PPPK Golongan V' },
    { id: '20', kode: 'VII', nama_pangkat: 'PPPK Golongan VII' },
    { id: '21', kode: 'IX', nama_pangkat: 'PPPK Golongan IX' },
  ]);
  
  const [formData, setFormData] = useState<Employee>({
    nama: '',
    nip: '',
    nik: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    agama: '',
    status_pernikahan: 'Belum Menikah',
    pendidikan_terakhir: '',
    handphone: '',
    email: '',
    alamat: '',
    unit: '',
    kriteria_asn: 'PNS',
    jabatan: '',
    grade_kelas_jabatan: '',
    tmt_jabatan_terakhir: '',
    pangkat: '',
    tmt_pangkat_terakhir: '',
    tmt_cpns: '',
    tmt_pns: '',
    tmt_pensiun: '',
    masa_kerja: '',
    ...employee
  });

  // Load work units from database
  useEffect(() => {
    const loadWorkUnits = async () => {
      try {
        const { data, error } = await supabase
          .from('work_units')
          .select('id, name')
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        
        // Map to the expected format
        const mappedUnits = (data || []).map(unit => ({
          id: unit.id,
          nama_unit: unit.name
        }));
        
        setUnitOptions(mappedUnits);
      } catch (error) {
        console.error('Error loading work units:', error);
      }
    };

    loadWorkUnits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors({});

    try {
      // Prepare data for validation
      const dataToValidate = {
        nama: sanitizeText(formData.nama),
        nip: formData.nip?.trim() || undefined,
        nik: formData.nik?.trim() || undefined,
        email: formData.email?.trim().toLowerCase() || undefined,
        handphone: formData.handphone?.trim() || undefined,
        tempat_lahir: formData.tempat_lahir?.trim() || undefined,
        tanggal_lahir: formData.tanggal_lahir ? new Date(formData.tanggal_lahir) : undefined,
        jenis_kelamin: formData.jenis_kelamin === 'L' ? 'Laki-laki' as const : 'Perempuan' as const,
        agama: formData.agama?.trim() || undefined,
        status_pernikahan: formData.status_pernikahan as 'Belum Menikah' | 'Menikah' | 'Cerai' | undefined,
        alamat: formData.alamat ? sanitizeText(formData.alamat) : undefined,
        unit: formData.unit?.trim() || undefined,
        jabatan: formData.jabatan?.trim() || undefined,
        pangkat: formData.pangkat?.trim() || undefined,
        pendidikan_terakhir: formData.pendidikan_terakhir?.trim() || undefined,
        tmt_cpns: formData.tmt_cpns ? new Date(formData.tmt_cpns) : undefined,
        tmt_pns: formData.tmt_pns ? new Date(formData.tmt_pns) : undefined,
        tmt_jabatan_terakhir: formData.tmt_jabatan_terakhir ? new Date(formData.tmt_jabatan_terakhir) : undefined,
        tmt_pangkat_terakhir: formData.tmt_pangkat_terakhir ? new Date(formData.tmt_pangkat_terakhir) : undefined,
      };

      // Validate with zod schema
      const validatedData = employeeFormSchema.parse(dataToValidate);

      // Prepare final data for database
      const finalData = {
        ...formData,
        nama: validatedData.nama,
        nip: validatedData.nip || null,
        nik: validatedData.nik || null,
        email: validatedData.email || null,
        handphone: validatedData.handphone || null,
        tempat_lahir: validatedData.tempat_lahir || null,
        tanggal_lahir: validatedData.tanggal_lahir ? 
          `${validatedData.tanggal_lahir.getFullYear()}-${String(validatedData.tanggal_lahir.getMonth() + 1).padStart(2, '0')}-${String(validatedData.tanggal_lahir.getDate()).padStart(2, '0')}` 
          : null,
        jenis_kelamin: validatedData.jenis_kelamin === 'Laki-laki' ? 'L' : 'P',
        agama: validatedData.agama || null,
        status_pernikahan: validatedData.status_pernikahan || null,
        alamat: validatedData.alamat || null,
        unit: validatedData.unit || null,
        jabatan: validatedData.jabatan || null,
        pangkat: validatedData.pangkat || null,
      };

      if (employee?.id) {
        // Update existing employee
        const { error } = await supabase
          .from('employees')
          .update(finalData)
          .eq('id', employee.id);
        
        if (error) throw error;
        
        toast({
          title: 'Berhasil',
          description: 'Data pegawai berhasil diperbarui',
        });
      } else {
        // Create new employee
        const { error } = await supabase
          .from('employees')
          .insert([finalData]);
        
        if (error) throw error;
        
        toast({
          title: 'Berhasil',
          description: 'Pegawai baru berhasil ditambahkan',
        });
      }

      onSave();
    } catch (error: any) {
      console.error('Employee form error:', error);
      
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        setError('Mohon periksa kembali data yang Anda masukkan');
      } else {
        setError(getUserFriendlyError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {employee?.id ? 'Edit Pegawai' : 'Tambah Pegawai Baru'}
        </CardTitle>
        <CardDescription>
          {employee?.id ? 'Perbarui informasi pegawai' : 'Masukkan data pegawai baru'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identitas Dasar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Identitas Dasar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                  required
                  className={validationErrors.nama ? 'border-red-500' : ''}
                />
                {validationErrors.nama && (
                  <p className="text-sm text-red-600">{validationErrors.nama}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nip">NIP</Label>
                <Input
                  id="nip"
                  value={formData.nip || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, nip: e.target.value.replace(/\D/g, '').slice(0, 18) }))}
                  placeholder="18 digit"
                  maxLength={18}
                  className={validationErrors.nip ? 'border-red-500' : ''}
                />
                {validationErrors.nip && (
                  <p className="text-sm text-red-600">{validationErrors.nip}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nik">NIK</Label>
                <Input
                  id="nik"
                  value={formData.nik || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value.replace(/\D/g, '').slice(0, 16) }))}
                  placeholder="16 digit"
                  maxLength={16}
                  className={validationErrors.nik ? 'border-red-500' : ''}
                />
                {validationErrors.nik && (
                  <p className="text-sm text-red-600">{validationErrors.nik}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                <Input
                  id="tempat_lahir"
                  value={formData.tempat_lahir || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tempat_lahir: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                <DatePicker
                  date={formData.tanggal_lahir ? new Date(formData.tanggal_lahir + 'T00:00:00') : undefined}
                  onSelect={(date) => setFormData(prev => ({ 
                    ...prev, 
                    tanggal_lahir: date ? 
                      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` 
                      : '' 
                  }))}
                  placeholder="Pilih tanggal lahir"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                <Select 
                  value={formData.jenis_kelamin || 'L'} 
                  onValueChange={(value: 'L' | 'P') => setFormData(prev => ({ ...prev, jenis_kelamin: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agama">Agama</Label>
                <Select 
                  value={formData.agama || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, agama: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih agama" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Islam">Islam</SelectItem>
                    <SelectItem value="Kristen">Kristen</SelectItem>
                    <SelectItem value="Katolik">Katolik</SelectItem>
                    <SelectItem value="Hindu">Hindu</SelectItem>
                    <SelectItem value="Buddha">Buddha</SelectItem>
                    <SelectItem value="Konghucu">Konghucu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status_pernikahan">Status Pernikahan</Label>
                <Select 
                  value={formData.status_pernikahan || 'Belum Menikah'} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status_pernikahan: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Belum Menikah">Belum Menikah</SelectItem>
                    <SelectItem value="Menikah">Menikah</SelectItem>
                    <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                    <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pendidikan_terakhir">Pendidikan Terakhir</Label>
                <Select 
                  value={formData.pendidikan_terakhir || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, pendidikan_terakhir: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pendidikan terakhir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SD">SD</SelectItem>
                    <SelectItem value="SMP">SMP</SelectItem>
                    <SelectItem value="SMA">SMA</SelectItem>
                    <SelectItem value="D3">D3</SelectItem>
                    <SelectItem value="S1">S1</SelectItem>
                    <SelectItem value="S2">S2</SelectItem>
                    <SelectItem value="S3">S3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Alamat & Kontak */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Alamat & Kontak</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat</Label>
                <Input
                  id="alamat"
                  value={formData.alamat || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={validationErrors.email ? 'border-red-500' : ''}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handphone">Handphone</Label>
                  <Input
                    id="handphone"
                    value={formData.handphone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, handphone: e.target.value }))}
                    placeholder="08xx atau +628xx"
                    className={validationErrors.handphone ? 'border-red-500' : ''}
                  />
                  {validationErrors.handphone && (
                    <p className="text-sm text-red-600">{validationErrors.handphone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Kepegawaian */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data Kepegawaian</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit Kerja</Label>
                <Input
                  id="unit"
                  value={formData.unit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="Masukkan nama unit kerja"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kriteria_asn">Kriteria ASN</Label>
                <Select 
                  value={formData.kriteria_asn || 'PNS'} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, kriteria_asn: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PNS">PNS</SelectItem>
                    <SelectItem value="PPPK">PPPK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jabatan">Jabatan</Label>
                <Input
                  id="jabatan"
                  value={formData.jabatan || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, jabatan: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade_kelas_jabatan">Grade / Kelas Jabatan</Label>
                <Input
                  id="grade_kelas_jabatan"
                  value={formData.grade_kelas_jabatan || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, grade_kelas_jabatan: e.target.value }))}
                  placeholder="Contoh: Pelaksana, Administrator"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmt_jabatan_terakhir">TMT Jabatan Terakhir</Label>
                <DatePicker
                  date={formData.tmt_jabatan_terakhir ? new Date(formData.tmt_jabatan_terakhir + 'T00:00:00') : undefined}
                  onSelect={(date) => setFormData(prev => ({ 
                    ...prev, 
                    tmt_jabatan_terakhir: date ? 
                      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` 
                      : '' 
                  }))}
                  placeholder="Pilih TMT jabatan terakhir"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pangkat">Pangkat/Golongan</Label>
                <Select 
                  value={formData.pangkat || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, pangkat: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pangkat/golongan" />
                  </SelectTrigger>
                  <SelectContent>
                    {pangkatOptions.map((pangkat) => (
                      <SelectItem key={pangkat.id} value={pangkat.kode}>
                        {pangkat.kode} - {pangkat.nama_pangkat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmt_pangkat_terakhir">TMT Pangkat Terakhir</Label>
                <DatePicker
                  date={formData.tmt_pangkat_terakhir ? new Date(formData.tmt_pangkat_terakhir + 'T00:00:00') : undefined}
                  onSelect={(date) => setFormData(prev => ({ 
                    ...prev, 
                    tmt_pangkat_terakhir: date ? 
                      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` 
                      : '' 
                  }))}
                  placeholder="Pilih TMT pangkat terakhir"
                />
              </div>
            </div>
          </div>

          {/* Data Karier */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data Karier</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tmt_cpns">TMT CPNS</Label>
                <DatePicker
                  date={formData.tmt_cpns ? new Date(formData.tmt_cpns + 'T00:00:00') : undefined}
                  onSelect={(date) => setFormData(prev => ({ 
                    ...prev, 
                    tmt_cpns: date ? 
                      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` 
                      : '' 
                  }))}
                  placeholder="Pilih TMT CPNS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmt_pns">TMT PNS</Label>
                <DatePicker
                  date={formData.tmt_pns ? new Date(formData.tmt_pns + 'T00:00:00') : undefined}
                  onSelect={(date) => setFormData(prev => ({ 
                    ...prev, 
                    tmt_pns: date ? 
                      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` 
                      : '' 
                  }))}
                  placeholder="Pilih TMT PNS"
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="tmt_pensiun">TMT Pensiun</Label>
                <DatePicker
                  date={formData.tmt_pensiun ? new Date(formData.tmt_pensiun + 'T00:00:00') : undefined}
                  onSelect={(date) => setFormData(prev => ({ 
                    ...prev, 
                    tmt_pensiun: date ? 
                      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` 
                      : '' 
                  }))}
                  placeholder="Pilih TMT pensiun"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="masa_kerja">Masa Kerja</Label>
                <Input
                  id="masa_kerja"
                  value={formData.masa_kerja || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, masa_kerja: e.target.value }))}
                  placeholder="Otomatis dihitung dari TMT CPNS"
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
