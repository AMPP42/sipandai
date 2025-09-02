
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  tipe_pegawai?: string;
  pangkat_golongan?: string;
  unit_kerja?: string;
  jabatan_terakhir?: string;
  email?: string;
  handphone?: string;
  is_active: boolean;
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
  const [pangkatOptions, setPangkatOptions] = useState<any[]>([]);
  const [unitOptions, setUnitOptions] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<Employee>({
    nama: '',
    nip: '',
    nik: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    agama: '',
    status_pernikahan: 'Belum Menikah',
    tipe_pegawai: 'PNS',
    pangkat_golongan: '',
    unit_kerja: '',
    jabatan_terakhir: '',
    email: '',
    handphone: '',
    is_active: true,
    ...employee
  });

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [pangkatResult, unitResult] = await Promise.all([
        supabase.from('ref_pangkat_golongan').select('*').eq('is_active', true).order('urutan'),
        supabase.from('ref_unit_kerja').select('*').eq('is_active', true).order('nama_unit')
      ]);

      if (pangkatResult.data) setPangkatOptions(pangkatResult.data);
      if (unitResult.data) setUnitOptions(unitResult.data);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

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
                <Input
                  id="tanggal_lahir"
                  type="date"
                  value={formData.tanggal_lahir || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
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
            </div>
          </div>

          {/* Kepegawaian */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Kepegawaian</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipe_pegawai">Tipe Pegawai</Label>
                <Select 
                  value={formData.tipe_pegawai || 'PNS'} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipe_pegawai: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPNS">CPNS</SelectItem>
                    <SelectItem value="PNS">PNS</SelectItem>
                    <SelectItem value="PPPK">PPPK</SelectItem>
                    <SelectItem value="Honorer">Honorer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pangkat_golongan">Pangkat/Golongan</Label>
                <Select 
                  value={formData.pangkat_golongan || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, pangkat_golongan: value }))}
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
                <Label htmlFor="unit_kerja">Unit Kerja</Label>
                <Select 
                  value={formData.unit_kerja || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit_kerja: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit kerja" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit.id} value={unit.nama_unit}>
                        {unit.nama_unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jabatan_terakhir">Jabatan</Label>
                <Input
                  id="jabatan_terakhir"
                  value={formData.jabatan_terakhir || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, jabatan_terakhir: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Kontak */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Kontak</h3>
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
