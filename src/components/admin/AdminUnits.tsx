import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RefreshCw, Plus, Edit, Trash2, Building2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface WorkUnit {
  id: string;
  code: string;
  name: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UnitFormData {
  code: string;
  name: string;
  category: string;
  is_active: boolean;
}

export default function AdminUnits() {
  const [units, setUnits] = useState<WorkUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<WorkUnit | null>(null);
  const [formData, setFormData] = useState<UnitFormData>({
    code: "",
    name: "",
    category: "",
    is_active: true,
  });

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("work_units")
        .select("*")
        .order("code");

      if (error) throw error;
      setUnits((data as WorkUnit[]) || []);
    } catch (error: any) {
      console.error("Error loading units:", error);
      toast.error("Gagal memuat data unit: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (unit?: WorkUnit) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        code: unit.code,
        name: unit.name,
        category: unit.category || "",
        is_active: unit.is_active,
      });
    } else {
      setEditingUnit(null);
      setFormData({
        code: "",
        name: "",
        category: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.code || !formData.name) {
        toast.error("Kode Unit dan Nama Unit harus diisi");
        return;
      }

      const saveData = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        category: formData.category || null,
        is_active: formData.is_active,
      };

      if (editingUnit) {
        const { error } = await supabase
          .from("work_units")
          .update(saveData)
          .eq("id", editingUnit.id);

        if (error) throw error;
        toast.success("Unit berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("work_units")
          .insert([saveData]);

        if (error) throw error;
        toast.success("Unit berhasil ditambahkan");
      }

      setIsDialogOpen(false);
      loadUnits();
    } catch (error: any) {
      console.error("Error saving unit:", error);
      toast.error("Gagal menyimpan unit: " + error.message);
    }
  };

  const handleDelete = async (unit: WorkUnit) => {
    if (!confirm(`Yakin ingin menghapus unit ${unit.name}?`)) return;

    try {
      const { error } = await supabase
        .from("work_units")
        .delete()
        .eq("id", unit.id);

      if (error) throw error;
      toast.success("Unit berhasil dihapus");
      loadUnits();
    } catch (error: any) {
      console.error("Error deleting unit:", error);
      toast.error("Gagal menghapus unit: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Kelola Unit Kerja
          </h2>
          <p className="text-muted-foreground mt-1">
            Kelola daftar unit kerja dan organisasi
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadUnits} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Unit
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Unit Kerja</CardTitle>
          <CardDescription>
            Total {units.length} unit terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Memuat data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Unit</TableHead>
                  <TableHead>Nama Unit</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-mono">{unit.code}</TableCell>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {unit.category || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={unit.is_active ? "default" : "secondary"}>
                        {unit.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenDialog(unit)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(unit)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {units.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Belum ada unit kerja terdaftar
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Edit Unit Kerja" : "Tambah Unit Kerja"}
            </DialogTitle>
            <DialogDescription>
              {editingUnit
                ? "Perbarui informasi unit kerja"
                : "Tambahkan unit kerja baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Unit *</Label>
              <Input
                id="code"
                placeholder="Contoh: UNIT-001"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                disabled={!!editingUnit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Unit *</Label>
              <Input
                id="name"
                placeholder="Nama unit kerja"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                placeholder="Kategori unit kerja (opsional)"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Status Aktif</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
