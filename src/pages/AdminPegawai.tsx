
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
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Upload,
  Lock,
  Unlock
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import EmployeeForm from '@/components/pegawai/EmployeeForm';
import EmployeeSearchFilters from '@/components/pegawai/EmployeeSearchFilters';
import ExcelUpload from '@/components/pegawai/ExcelUpload';

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
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [pangkatFilter, setPangkatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Reference data - loaded dynamically from database
  const [unitOptions, setUnitOptions] = useState<Array<{ id: string; nama_unit: string }>>([]);
  const [pangkatOptions, setPangkatOptions] = useState<Array<{ id: string; kode: string; nama_pangkat: string }>>([]);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    approaching_retirement: 0,
    units: 0
  });

  // Helper function to check if user can edit an employee
  const canEditEmployee = (employee: Employee): boolean => {
    if (user?.role === 'admin_pusat') return true;
    if (user?.role === 'admin_unit' && user?.unit === employee.unit) return true;
    return false;
  };

  useEffect(() => {
    loadReferenceData();
    loadEmployees();
  }, [searchTerm, unitFilter, pangkatFilter, statusFilter, currentPage]);

  const loadReferenceData = async () => {
    try {
      // Load work units
      const { data: units, error: unitsError } = await supabase
        .from('work_units')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (unitsError) throw unitsError;
      
      setUnitOptions(units?.map(u => ({ id: u.id, nama_unit: u.name })) || []);

      // Load ranks/pangkat
      const { data: ranks, error: ranksError } = await supabase
        .from('ranks')
        .select('id, code, name')
        .eq('is_active', true)
        .order('level');
      
      if (ranksError) throw ranksError;
      
      setPangkatOptions(ranks?.map(r => ({ id: r.id, kode: r.code, nama_pangkat: r.name })) || []);
    } catch (error: any) {
      console.error('Error loading reference data:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      // Build base query - ALL authenticated users can now view ALL employees
      let baseQuery = supabase
        .from('employees')
        .select(`
          id, nama, nip, nik, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, 
          status_pernikahan, pendidikan_terakhir, handphone, email, alamat, unit, 
          kriteria_asn, jabatan, grade_kelas_jabatan, tmt_jabatan_terakhir, pangkat, 
          tmt_pangkat_terakhir, tmt_cpns, tmt_pns, tmt_pensiun, masa_kerja, 
          created_at, updated_at
        `);

      // No unit filter for viewing - all users can see all employees

      // Apply filters
      if (searchTerm) {
        baseQuery = baseQuery.or(`nama.ilike.%${searchTerm}%,nip.ilike.%${searchTerm}%,unit.ilike.%${searchTerm}%`);
      }

      if (unitFilter !== 'all') {
        baseQuery = baseQuery.eq('unit', unitFilter);
      }

      if (pangkatFilter !== 'all') {
        baseQuery = baseQuery.eq('pangkat', pangkatFilter);
      }

      if (statusFilter !== 'all') {
        baseQuery = baseQuery.eq('kriteria_asn', statusFilter);
      }

      // Get total count for pagination with same filters
      let countQuery = supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
      
      // No unit filter - all users can see all employees
      
      // Apply same filters as main query
      if (searchTerm) {
        countQuery = countQuery.or(`nama.ilike.%${searchTerm}%,nip.ilike.%${searchTerm}%,unit.ilike.%${searchTerm}%`);
      }
      if (unitFilter !== 'all') {
        countQuery = countQuery.eq('unit', unitFilter);
      }
      if (pangkatFilter !== 'all') {
        countQuery = countQuery.eq('pangkat', pangkatFilter);
      }
      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('kriteria_asn', statusFilter);
      }
      
      const { count } = await countQuery;
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

      // Get paginated data
      const { data, error } = await baseQuery
        .order('nama')
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

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

      setEmployees(mappedEmployees);
      
      // Load stats separately for accurate counts across all data
      await loadStats();

    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total count - all employees for transparency
      let totalQuery = supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
      const { count: totalCount } = await totalQuery;

      // Get editable count for admin_unit
      let editableQuery = supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
      if (user?.role === 'admin_unit' && user?.unit) {
        editableQuery = editableQuery.eq('unit', user.unit);
      }
      const { count: editableCount } = await editableQuery;

      // Get active count
      let activeQuery = supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .not('kriteria_asn', 'is', null);
      const { count: activeCount } = await activeQuery;

      // Get approaching retirement count
      const today = new Date();
      const twoYearsFromNow = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
      let retirementQuery = supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .not('tmt_pensiun', 'is', null)
        .lte('tmt_pensiun', twoYearsFromNow.toISOString().split('T')[0])
        .gt('tmt_pensiun', today.toISOString().split('T')[0]);
      const { count: retirementCount } = await retirementQuery;

      // Get units count from work_units reference table
      const { count: unitsCount } = await supabase
        .from('work_units')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setStats({
        total: totalCount || 0,
        active: activeCount || 0,
        approaching_retirement: retirementCount || 0,
        units: unitsCount || 0
      });

    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const handleEdit = (employee: Employee) => {
    // Check if user can edit this employee
    if (!canEditEmployee(employee)) {
      setError(`Anda hanya dapat mengedit data pegawai dari unit ${user?.unit}`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = async (employee: Employee) => {
    // Check if user can delete this employee
    if (!canEditEmployee(employee)) {
      setError(`Anda hanya dapat menghapus data pegawai dari unit ${user?.unit}`);
      setTimeout(() => setError(''), 3000);
      return;
    }

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
    setCurrentPage(1); // Reset to first page
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
    setShowExcelUpload(true);
  };

  const handleUploadComplete = () => {
    setShowExcelUpload(false);
    setCurrentPage(1); // Reset to first page
    loadEmployees();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setUnitFilter('all');
    setPangkatFilter('all');
    setStatusFilter('all');
    setCurrentPage(1); // Reset to first page
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

  if (showExcelUpload) {
    return (
      <div className="p-6 animate-fade-in">
        <ExcelUpload
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowExcelUpload(false)}
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
            {user?.role === 'admin_unit' && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Unlock className="w-3 h-3 mr-1" />
                  Dapat mengedit: Unit {user?.unit}
                </Badge>
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  <Lock className="w-3 h-3 mr-1" />
                  Dapat melihat: Semua unit
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowExcelUpload(true)} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload Excel
            </Button>
            <Button onClick={() => setShowForm(true)} className="btn-primary">
              <UserPlus className="w-4 h-4 mr-2" />
              Tambah Pegawai
            </Button>
          </div>
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
            Data lengkap pegawai dan informasi kepegawaian (Halaman {currentPage} dari {totalPages}, Total: {totalCount.toLocaleString()} pegawai)
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
                  {user?.role === 'admin_unit' && <TableHead>Akses</TableHead>}
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const canEdit = canEditEmployee(employee);
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.nama}</TableCell>
                      <TableCell>{employee.nip || '-'}</TableCell>
                      <TableCell>{employee.nik || '-'}</TableCell>
                      <TableCell>{employee.unit || '-'}</TableCell>
                      <TableCell>{employee.jabatan || '-'}</TableCell>
                      <TableCell>{employee.pangkat || '-'}</TableCell>
                      <TableCell>{getStatusBadge(employee)}</TableCell>
                      <TableCell>
                        {employee.tmt_pensiun 
                          ? new Date(employee.tmt_pensiun + 'T00:00:00').toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : '-'}
                      </TableCell>
                      {user?.role === 'admin_unit' && (
                        <TableCell>
                          {canEdit ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              <Unlock className="w-3 h-3 mr-1" />
                              Dapat Diedit
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              Hanya Lihat
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(employee)}
                            disabled={!canEdit}
                            className={!canEdit ? 'opacity-50 cursor-not-allowed' : ''}
                            title={!canEdit ? 'Anda hanya dapat mengedit data dari unit Anda' : 'Edit data pegawai'}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDelete(employee)}
                            disabled={!canEdit}
                            className={!canEdit ? 'opacity-50 cursor-not-allowed' : ''}
                            title={!canEdit ? 'Anda hanya dapat menghapus data dari unit Anda' : 'Hapus data pegawai'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && employees.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
