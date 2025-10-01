import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { HelpCircle, Plus, Edit, Trash2, ThumbsUp, ThumbsDown, Eye, EyeOff } from 'lucide-react';

interface FAQItem {
  id: string;
  pertanyaan: string;
  jawaban: string;
  kategori: string;
  helpful: number;
  not_helpful: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function AdminFAQ() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    pertanyaan: '',
    jawaban: '',
    kategori: 'Mutasi',
    is_active: true,
    display_order: 0,
  });

  // Filters
  const [kategoriFilter, setKategoriFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadFaqs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('faq-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'faq_items',
        },
        () => {
          loadFaqs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterFaqs();
  }, [faqs, kategoriFilter, statusFilter]);

  const loadFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat FAQ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterFaqs = () => {
    let filtered = faqs;

    if (kategoriFilter !== 'all') {
      filtered = filtered.filter((f) => f.kategori === kategoriFilter);
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter((f) => f.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((f) => !f.is_active);
    }

    setFilteredFaqs(filtered);
  };

  const handleOpenDialog = (faq?: FAQItem) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        pertanyaan: faq.pertanyaan,
        jawaban: faq.jawaban,
        kategori: faq.kategori,
        is_active: faq.is_active,
        display_order: faq.display_order,
      });
    } else {
      setEditingFaq(null);
      setFormData({
        pertanyaan: '',
        jawaban: '',
        kategori: 'Mutasi',
        is_active: true,
        display_order: faqs.length,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveFaq = async () => {
    if (!formData.pertanyaan.trim() || !formData.jawaban.trim()) {
      toast({
        title: 'Error',
        description: 'Pertanyaan dan jawaban tidak boleh kosong',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingFaq) {
        // Update existing
        const { error } = await supabase
          .from('faq_items')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFaq.id);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'FAQ berhasil diperbarui',
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('faq_items')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'FAQ baru berhasil ditambahkan',
        });
      }

      setIsDialogOpen(false);
      loadFaqs();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan FAQ',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Yakin ingin menghapus FAQ ini?')) return;

    try {
      const { error } = await supabase
        .from('faq_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'FAQ berhasil dihapus',
      });

      loadFaqs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus FAQ',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('faq_items')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: `FAQ ${!isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      });

      loadFaqs();
    } catch (error) {
      console.error('Error toggling FAQ:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah status FAQ',
        variant: 'destructive',
      });
    }
  };

  const stats = {
    total: faqs.length,
    active: faqs.filter((f) => f.is_active).length,
    totalHelpful: faqs.reduce((sum, f) => sum + f.helpful, 0),
    totalNotHelpful: faqs.reduce((sum, f) => sum + f.not_helpful, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat FAQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total FAQ</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Helpful</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHelpful}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Helpful</CardTitle>
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNotHelpful}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kelola FAQ</CardTitle>
              <CardDescription>
                Tambah dan kelola pertanyaan yang sering ditanyakan
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah FAQ Baru
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div className="space-y-2">
              <Label htmlFor="kategori-filter">Kategori</Label>
              <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
                <SelectTrigger id="kategori-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="Mutasi">Mutasi</SelectItem>
                  <SelectItem value="Kenaikan Pangkat">Kenaikan Pangkat</SelectItem>
                  <SelectItem value="Pensiun">Pensiun</SelectItem>
                  <SelectItem value="Umum">Umum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Pertanyaan</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-center">Helpful</TableHead>
                <TableHead className="text-center">Not Helpful</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Tidak ada FAQ yang ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredFaqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="font-medium">{faq.display_order + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{faq.pertanyaan}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {faq.jawaban}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{faq.kategori}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                        <span>{faq.helpful}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                        <span>{faq.not_helpful}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={faq.is_active}
                        onCheckedChange={() => handleToggleActive(faq.id, faq.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(faq)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteFaq(faq.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* FAQ Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFaq ? 'Edit FAQ' : 'Tambah FAQ Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingFaq
                ? 'Perbarui informasi FAQ'
                : 'Masukkan pertanyaan dan jawaban yang sering ditanyakan'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pertanyaan">Pertanyaan *</Label>
              <Input
                id="pertanyaan"
                value={formData.pertanyaan}
                onChange={(e) =>
                  setFormData({ ...formData, pertanyaan: e.target.value })
                }
                placeholder="Masukkan pertanyaan..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jawaban">Jawaban *</Label>
              <Textarea
                id="jawaban"
                value={formData.jawaban}
                onChange={(e) =>
                  setFormData({ ...formData, jawaban: e.target.value })
                }
                placeholder="Masukkan jawaban..."
                rows={6}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori *</Label>
                <Select
                  value={formData.kategori}
                  onValueChange={(value) =>
                    setFormData({ ...formData, kategori: value })
                  }
                >
                  <SelectTrigger id="kategori">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mutasi">Mutasi</SelectItem>
                    <SelectItem value="Kenaikan Pangkat">Kenaikan Pangkat</SelectItem>
                    <SelectItem value="Pensiun">Pensiun</SelectItem>
                    <SelectItem value="Umum">Umum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display-order">Urutan Tampilan</Label>
                <Input
                  id="display-order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is-active">FAQ Aktif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveFaq} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : editingFaq ? 'Perbarui' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
