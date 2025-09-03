
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  UserPlus, 
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EmployeeForm from '@/components/pegawai/EmployeeForm';
import EmployeeSearchFilters from '@/components/pegawai/EmployeeSearchFilters';

interface Employee {
  id: string;
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
  unit?: string;
  kriteria_asn?: string;
  jabatan?: string;
  grade_kelas_jabatan?: string;
  tmt_jabatan_terakhir?: string;
  pangkat?: string;
  tmt_pangkat_terakhir?: string;
  tmt_cpns?: string;
  tmt_pns?: string;
  tmt_pensiun?: string;
  masa_kerja?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminPegawai() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [pangkatFilter, setPangkatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Reference data - using static data for now
  const [unitOptions] = useState([
    { id: '1', nama_unit: 'BKPSDM' },
    { id: '2', nama_unit: 'Dinas Pendidikan' },
    { id: '3', nama_unit: 'Dinas Kesehatan' },
    { id: '4', nama_unit: 'Dinas Perhubungan' },
  ]);
  const [pangkatOptions] = useState([
    { id: '1', kode: 'I/a', nama_pangkat: 'Juru Muda' },
    { id: '2', kode: 'I/b', nama_pangkat: 'Juru Muda Tingkat I' },
    { id: '3', kode: 'II/a', nama_pangkat: 'Pengatur Muda' },
    { id: '4', kode: 'III/a', nama_pangkat: 'Penata Muda' },
    { id: '5', kode: 'IV/a', nama_pangkat: 'Pembina' },
  ]);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    approaching_retirement: 0,
    units: 0
  });

  useEffect(() => {
    loadEmployees();
  }, [searchTerm, unitFilter, pangkatFilter, statusFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, nama, nip, nik, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, 
          status_pernikahan, pendidikan_terakhir, handphone, email, alamat, unit, 
          kriteria_asn, jabatan, grade_kelas_jabatan, tmt_jabatan_terakhir, pangkat, 
          tmt_pangkat_terakhir, tmt_cpns, tmt_pns, tmt_pensiun, masa_kerja, 
          created_at, updated_at
        `)
        .order('nama');

      if (error) throw error;

      // Map the data to match our Employee interface
      const mappedEmployees: Employee[] = (data || []).map(emp => ({
        id: emp.id,
        nama: emp.nama,
        nip: emp.nip || undefined,
        nik: emp.nik || undefined,
        tempat_lahir: emp.tempat_lahir || undefined,
        tanggal_lahir: emp.tanggal_lahir || undefined,
        jenis_kelamin: (emp.jenis_kelamin === 'L' || emp.jenis_kelamin === 'P') ? emp.jenis_kelamin : undefined,
        agama: emp.agama || undefined,
        status_pernikahan: emp.status_pernikahan || undefined,
        pendidikan_terakhir: emp.pendidikan_terakhir || undefined,
        handphone: emp.handphone || undefined,
        email: emp.email || undefined,
        alamat: emp.alamat || undefined,
        unit: emp.unit || undefined,
        kriteria_asn: emp.kriteria_asn || undefined,
        jabatan: emp.jabatan || undefined,
        grade_kelas_jabatan: emp.grade_kelas_jabatan || undefined,
        tmt_jabatan_terakhir: emp.tmt_jabatan_terakhir || undefined,
        pangkat: emp.pangkat || undefined,
        tmt_pangkat_terakhir: emp.tmt_pangkat_terakhir || undefined,
        tmt_cpns: emp.tmt_cpns || undefined,
        tmt_pns: emp.tmt_pns || undefined,
        tmt_pensiun: emp.tmt_pensiun || undefined,
        masa_kerja: emp.masa_kerja || undefined,
        created_at: emp.created_at,
        updated_at: emp.updated_at
      }));

      // Apply filters on the mapped data
      let filteredEmployees = mappedEmployees;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredEmployees = filteredEmployees.filter(emp =>
          emp.nama.toLowerCase().includes(term) ||
          (emp.nip && emp.nip.toLowerCase().includes(term)) ||
          (emp.unit && emp.unit.toLowerCase().includes(term))
        );
      }

      if (unitFilter !== 'all') {
        filteredEmployees = filteredEmployees.filter(emp => 
          emp.unit === unitFilter
        );
      }

      if (pangkatFilter !== 'all') {
        filteredEmployees = filteredEmployees.filter(emp => 
          emp.pangkat === pangkatFilter
        );
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'PNS') {
          filteredEmployees = filteredEmployees.filter(emp => emp.kriteria_asn === 'PNS');
        } else if (statusFilter === 'PPPK') {
          filteredEmployees = filteredEmployees.filter(emp => emp.kriteria_asn === 'PPPK');
        }
      }

      setEmployees(filteredEmployees);
      
      // Calculate stats
      const total = filteredEmployees.length;
      const active = filteredEmployees.filter(emp => emp.kriteria_asn).length;
      
      // Calculate approaching retirement (within 2 years)
      const today = new Date();
      const twoYearsFromNow = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
      const approaching_retirement = filteredEmployees.filter(emp => {
        if (emp.tmt_pensiun) {
          const retirementDate = new Date(emp.tmt_pensiun);
          return retirementDate <= twoYearsFromNow && retirementDate > today;
        }
        return false;
      }).length;
      
      const units = new Set(filteredEmployees.map(emp => emp.unit).filter(Boolean)).size;
      
      setStats({ total, active, approaching_retirement, units });

    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data pegawai ${employee.nama}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employee.id);

      if (error) throw error;

      loadEmployees();
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat menghapus data');
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingEmployee(null);
    loadEmployees();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  const handleExport = () => {
    alert('Fitur export akan segera tersedia');
  };

  const handleImport = () => {
    alert('Fitur import akan segera tersedia');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setUnitFilter('all');
    setPangkatFilter('all');
    setStatusFilter('all');
  };

  const getStatusBadge = (employee: Employee) => {
    if (employee.kriteria_asn === 'PNS') {
      return <Badge className="bg-green-100 text-green-700">PNS</Badge>;
    } else if (employee.kriteria_asn === 'PPPK') {
      return <Badge className="bg-blue-100 text-blue-700">PPPK</Badge>;
    }
    
    return <Badge className="bg-gray-100 text-gray-700">-</Badge>;
  };

  if (showForm) {
    return (
      <div className="p-6 animate-fade-in">
        <EmployeeForm
          employee={editingEmployee}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-lg">
                <Users className="w-6 h-6 text-brand-600" />
              </div>
              Database Pegawai
            </h1>
            <p className="text-gray-600 mt-2">
              Kelola data master pegawai dan informasi kepegawaian
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="btn-primary">
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Pegawai
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pegawai</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PNS & PPPK</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mendekati Pensiun</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.approaching_retirement}</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unit Kerja</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.units}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <EmployeeSearchFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        unitFilter={unitFilter}
        onUnitFilterChange={setUnitFilter}
        pangkatFilter={pangkatFilter}
        onPangkatFilterChange={setPangkatFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onExport={handleExport}
        onImport={handleImport}
        onClearFilters={clearFilters}
        unitOptions={unitOptions}
        pangkatOptions={pangkatOptions}
      />

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pegawai</CardTitle>
          <CardDescription>
            Data lengkap pegawai dan informasi kepegawaian
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data pegawai yang ditemukan
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Pangkat</TableHead>
                  <TableHead>Kriteria ASN</TableHead>
                  <TableHead>TMT Pensiun</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.nama}</TableCell>
                    <TableCell>{employee.nip || '-'}</TableCell>
                    <TableCell>{employee.nik || '-'}</TableCell>
                    <TableCell>{employee.unit || '-'}</TableCell>
                    <TableCell>{employee.jabatan || '-'}</TableCell>
                    <TableCell>{employee.pangkat || '-'}</TableCell>
                    <TableCell>{getStatusBadge(employee)}</TableCell>
                    <TableCell>
                      {employee.tmt_pensiun ? new Date(employee.tmt_pensiun).toLocaleDateString('id-ID') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(employee)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDelete(employee)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
