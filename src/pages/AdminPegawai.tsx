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
  unit_kerja?: string;
  jabatan_terakhir?: string;
  pangkat_golongan?: string;
  tipe_pegawai?: string;
  email?: string;
  handphone?: string;
  tanggal_lahir?: string;
  tmt_pensiun?: string;
  is_active?: boolean;
  created_at: string;
  jabatan?: string;
  status?: string;
  unit?: string;
  pangkat?: string;
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
  
  // Reference data - using static data for now until reference tables are available
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
      
      // Use a simple select all approach to avoid complex type issues
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('nama');

      if (error) throw error;

      // Map the data to ensure it matches our Employee interface
      const mappedEmployees: Employee[] = (data || []).map(emp => ({
        id: emp.id,
        nama: emp.nama,
        nip: emp.nip,
        nik: emp.nik || undefined,
        unit_kerja: emp.unit_kerja || emp.unit,
        jabatan_terakhir: emp.jabatan_terakhir || emp.jabatan,
        pangkat_golongan: emp.pangkat_golongan || emp.pangkat,
        tipe_pegawai: emp.tipe_pegawai,
        email: emp.email,
        handphone: emp.handphone,
        tanggal_lahir: emp.tanggal_lahir,
        tmt_pensiun: emp.tmt_pensiun,
        is_active: emp.is_active !== false, // Default to true if undefined
        created_at: emp.created_at,
        // Keep old fields for compatibility
        jabatan: emp.jabatan,
        status: emp.status,
        unit: emp.unit,
        pangkat: emp.pangkat,
        updated_at: emp.updated_at
      }));

      // Apply filters on the mapped data
      let filteredEmployees = mappedEmployees;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredEmployees = filteredEmployees.filter(emp =>
          emp.nama.toLowerCase().includes(term) ||
          (emp.nip && emp.nip.toLowerCase().includes(term)) ||
          (emp.nik && emp.nik.toLowerCase().includes(term)) ||
          (emp.unit_kerja && emp.unit_kerja.toLowerCase().includes(term))
        );
      }

      if (unitFilter !== 'all') {
        filteredEmployees = filteredEmployees.filter(emp => 
          emp.unit_kerja === unitFilter || emp.unit === unitFilter
        );
      }

      if (pangkatFilter !== 'all') {
        filteredEmployees = filteredEmployees.filter(emp => 
          emp.pangkat_golongan === pangkatFilter || emp.pangkat === pangkatFilter
        );
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          filteredEmployees = filteredEmployees.filter(emp => emp.is_active !== false);
        } else if (statusFilter === 'inactive') {
          filteredEmployees = filteredEmployees.filter(emp => emp.is_active === false);
        } else if (statusFilter === 'approaching_retirement') {
          const twoYearsFromNow = new Date();
          twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
          filteredEmployees = filteredEmployees.filter(emp => 
            emp.is_active !== false && emp.tmt_pensiun && 
            new Date(emp.tmt_pensiun) <= twoYearsFromNow
          );
        }
      }

      setEmployees(filteredEmployees);
      
      // Calculate stats
      const total = filteredEmployees.length;
      const active = filteredEmployees.filter(emp => emp.is_active !== false).length;
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
      const approaching_retirement = filteredEmployees.filter(emp => 
        emp.is_active !== false && emp.tmt_pensiun && 
        new Date(emp.tmt_pensiun) <= twoYearsFromNow
      ).length;
      const units = new Set(filteredEmployees.map(emp => emp.unit_kerja || emp.unit).filter(Boolean)).size;
      
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
    if (employee.is_active === false) {
      return <Badge className="bg-gray-100 text-gray-700">Tidak Aktif</Badge>;
    }
    
    if (employee.tmt_pensiun) {
      const pensiunDate = new Date(employee.tmt_pensiun);
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
      
      if (pensiunDate <= twoYearsFromNow) {
        return <Badge className="bg-orange-100 text-orange-700">Mendekati Pensiun</Badge>;
      }
    }
    
    return <Badge className="bg-green-100 text-green-700">Aktif</Badge>;
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
                <p className="text-sm font-medium text-gray-600">Pegawai Aktif</p>
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
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Pangkat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.nama}</TableCell>
                    <TableCell>{employee.nip || '-'}</TableCell>
                    <TableCell>{employee.unit_kerja || employee.unit || '-'}</TableCell>
                    <TableCell>{employee.jabatan_terakhir || employee.jabatan || '-'}</TableCell>
                    <TableCell>{employee.pangkat_golongan || employee.pangkat || '-'}</TableCell>
                    <TableCell>{getStatusBadge(employee)}</TableCell>
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
