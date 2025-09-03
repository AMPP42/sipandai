
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pangkatOptions] = useState([
    { id: '1', kode: 'I/a', nama_pangkat: 'Juru Muda' },
    { id: '2', kode: 'I/b', nama_pangkat: 'Juru Muda Tingkat I' },
    { id: '3', kode: 'II/a', nama_pangkat: 'Pengatur Muda' },
    { id: '4', kode: 'III/a', nama_pangkat: 'Penata Muda' },
    { id: '5', kode: 'IV/a', nama_pangkat: 'Pembina' },
  ]);
  const [unitOptions] = useState([
    { id: '1', nama_unit: 'BKPSDM' },
    { id: '2', nama_unit: 'Dinas Pendidikan' },
    { id: '3', nama_unit: 'Dinas Kesehatan' },
    { id: '4', nama_unit: 'Dinas Perhubungan' },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (employee?.id) {
        // Update existing employee
        const { error } = await supabase
          .from('employees')
          .update(formData)
          .eq('id', employee.id);
        
        if (error) throw error;
      } else {
        // Create new employee
        const { error } = await supabase
          .from('employees')
          .insert([formData]);
        
        if (error) throw error;
      }

      onSave();
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat menyimpan data');
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nip">NIP</Label>
                <Input
                  id="nip"
                  value={formData.nip || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, nip: e.target.value }))}
                  placeholder="18 digit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nik">NIK</Label>
                <Input
                  id="nik"
                  value={formData.nik || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                  placeholder="16 digit"
                />
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handphone">Handphone</Label>
                  <Input
                    id="handphone"
                    value={formData.handphone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, handphone: e.target.value }))}
                  />
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
                  disabled
                />
                <p className="text-sm text-gray-500">Otomatis dihitung dari tanggal lahir + 60 tahun</p>
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
