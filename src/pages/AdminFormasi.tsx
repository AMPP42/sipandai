
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  UserCheck, 
  Plus, 
  TrendingUp,
  Building,
  Users,
  CheckCircle,
  Edit,
  Trash2,
  RefreshCw,
  Search
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Position {
  id: string;
  unit: string;
  jabatan: string;
  existing: number;
  kebutuhan: number;
  gap: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

interface PositionStats {
  totalFormasi: number;
  terpenuhi: number;
  dibutuhkan: number;
  unitKerja: number;
}

export default function AdminFormasi() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [stats, setStats] = useState<PositionStats>({
    totalFormasi: 0,
    terpenuhi: 0,
    dibutuhkan: 0,
    unitKerja: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPosition, setNewPosition] = useState({
    unit: '',
    jabatan: '',
    existing: 0,
    kebutuhan: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPositions(data || []);

      // Calculate stats
      const totalFormasi = data?.length || 0;
      const terpenuhi = data?.filter(p => (p.gap || 0) <= 0).length || 0;
      const dibutuhkan = data?.filter(p => (p.gap || 0) > 0).length || 0;
      const uniqueUnits = new Set(data?.map(p => p.unit) || []);
      const unitKerja = uniqueUnits.size;

      setStats({
        totalFormasi,
        terpenuhi,
        dibutuhkan,
        unitKerja
      });

    } catch (error) {
      console.error('Error loading positions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data formasi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateGapAndStatus = (existing: number, kebutuhan: number) => {
    const gap = kebutuhan - existing;
    let status = 'terpenuhi';
    
    if (gap > 0) {
      status = 'dibutuhkan';
    } else if (gap < 0) {
      status = 'berlebih';
    }
    
    return { gap, status };
  };

  const createPosition = async () => {
    try {
      const { gap, status } = calculateGapAndStatus(newPosition.existing, newPosition.kebutuhan);
      
      const { error } = await supabase
        .from('positions')
        .insert([{
          unit: newPosition.unit,
          jabatan: newPosition.jabatan,
          existing: newPosition.existing,
          kebutuhan: newPosition.kebutuhan,
          gap,
          status
        }]);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Formasi berhasil ditambahkan"
      });

      setNewPosition({
        unit: '',
        jabatan: '',
        existing: 0,
        kebutuhan: 0
      });
      setIsCreateDialogOpen(false);
      loadPositions();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan formasi",
        variant: "destructive"
      });
    }
  };

  const updatePosition = async () => {
    if (!editingPosition) return;

    try {
      const { gap, status } = calculateGapAndStatus(editingPosition.existing, editingPosition.kebutuhan);
      
      const { error } = await supabase
        .from('positions')
        .update({
          unit: editingPosition.unit,
          jabatan: editingPosition.jabatan,
          existing: editingPosition.existing,
          kebutuhan: editingPosition.kebutuhan,
          gap,
          status
        })
        .eq('id', editingPosition.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data formasi berhasil diperbarui"
      });

      setIsEditDialogOpen(false);
      setEditingPosition(null);
      loadPositions();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui formasi",
        variant: "destructive"
      });
    }
  };

  const deletePosition = async (positionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus formasi ini?')) return;

    try {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', positionId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Formasi berhasil dihapus"
      });

      loadPositions();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus formasi",
        variant: "destructive"
      });
    }
  };

  const filteredPositions = positions.filter(position =>
    position.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    position.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'terpenuhi':
        return <Badge className="bg-green-100 text-green-700">Terpenuhi</Badge>;
      case 'dibutuhkan':
        return <Badge className="bg-red-100 text-red-700">Dibutuhkan</Badge>;
      case 'berlebih':
        return <Badge className="bg-yellow-100 text-yellow-700">Berlebih</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-brand-600" />
              </div>
              Formasi Jabatan
            </h1>
            <p className="text-gray-600 mt-2">
              Kelola formasi dan kebutuhan jabatan di setiap unit kerja
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={loadPositions} 
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Formasi
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Formasi Baru</DialogTitle>
                  <DialogDescription>
                    Tambahkan formasi jabatan untuk unit kerja
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="unit">Unit Kerja</Label>
                    <Input
                      id="unit"
                      value={newPosition.unit}
                      onChange={(e) => setNewPosition({...newPosition, unit: e.target.value})}
                      placeholder="Contoh: Dinas Pendidikan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="jabatan">Jabatan</Label>
                    <Input
                      id="jabatan"
                      value={newPosition.jabatan}
                      onChange={(e) => setNewPosition({...newPosition, jabatan: e.target.value})}
                      placeholder="Contoh: Guru SD"
                    />
                  </div>
                  <div>
                    <Label htmlFor="existing">Jumlah Existing</Label>
                    <Input
                      id="existing"
                      type="number"
                      value={newPosition.existing}
                      onChange={(e) => setNewPosition({...newPosition, existing: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="kebutuhan">Jumlah Kebutuhan</Label>
                    <Input
                      id="kebutuhan"
                      type="number"
                      value={newPosition.kebutuhan}
                      onChange={(e) => setNewPosition({...newPosition, kebutuhan: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={createPosition}>
                    Tambah Formasi
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cari berdasarkan unit kerja atau jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Formasi</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalFormasi}</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terpenuhi</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.terpenuhi}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dibutuhkan</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.dibutuhkan}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unit Kerja</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.unitKerja}</p>
              </div>
              <Building className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formasi Table */}
      <Card>
        <CardHeader>
          <CardTitle>Analisis Formasi Jabatan</CardTitle>
          <CardDescription>
            Analisis kebutuhan dan gap formasi jabatan per unit kerja
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Existing</TableHead>
                  <TableHead>Kebutuhan</TableHead>
                  <TableHead>Gap</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">{position.unit}</TableCell>
                    <TableCell>{position.jabatan}</TableCell>
                    <TableCell>{position.existing}</TableCell>
                    <TableCell>{position.kebutuhan}</TableCell>
                    <TableCell className={
                      (position.gap || 0) > 0 ? 'text-red-600 font-semibold' : 
                      (position.gap || 0) < 0 ? 'text-yellow-600 font-semibold' : 'text-green-600'
                    }>
                      {(position.gap || 0) > 0 ? `+${position.gap}` : position.gap || 0}
                    </TableCell>
                    <TableCell>{getStatusBadge(position.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingPosition(position);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deletePosition(position.id)}
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

      {/* Edit Position Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Formasi</DialogTitle>
            <DialogDescription>
              Perbarui informasi formasi jabatan
            </DialogDescription>
          </DialogHeader>
          {editingPosition && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-unit">Unit Kerja</Label>
                <Input
                  id="edit-unit"
                  value={editingPosition.unit}
                  onChange={(e) => setEditingPosition({...editingPosition, unit: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-jabatan">Jabatan</Label>
                <Input
                  id="edit-jabatan"
                  value={editingPosition.jabatan}
                  onChange={(e) => setEditingPosition({...editingPosition, jabatan: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-existing">Jumlah Existing</Label>
                <Input
                  id="edit-existing"
                  type="number"
                  value={editingPosition.existing}
                  onChange={(e) => setEditingPosition({...editingPosition, existing: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="edit-kebutuhan">Jumlah Kebutuhan</Label>
                <Input
                  id="edit-kebutuhan"
                  type="number"
                  value={editingPosition.kebutuhan}
                  onChange={(e) => setEditingPosition({...editingPosition, kebutuhan: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={updatePosition}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              Proyeksi Kebutuhan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Total gap kebutuhan: <span className="font-semibold text-red-600">
                +{positions.reduce((total, pos) => total + (pos.gap && pos.gap > 0 ? pos.gap : 0), 0)} pegawai
              </span>
            </p>
            <Button className="btn-secondary w-full" disabled>
              Lihat Proyeksi (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              Laporan Formasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Total formasi yang perlu diisi: <span className="font-semibold text-red-600">
                {stats.dibutuhkan} posisi
              </span>
            </p>
            <Button className="btn-secondary w-full" disabled>
              Generate Laporan (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
