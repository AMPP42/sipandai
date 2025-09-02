
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Download, Upload, X } from 'lucide-react';

interface EmployeeSearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  unitFilter: string;
  onUnitFilterChange: (value: string) => void;
  pangkatFilter: string;
  onPangkatFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onExport: () => void;
  onImport: () => void;
  onClearFilters: () => void;
  unitOptions: any[];
  pangkatOptions: any[];
}

export default function EmployeeSearchFilters({
  searchTerm,
  onSearchChange,
  unitFilter,
  onUnitFilterChange,
  pangkatFilter,
  onPangkatFilterChange,
  statusFilter,
  onStatusFilterChange,
  onExport,
  onImport,
  onClearFilters,
  unitOptions,
  pangkatOptions
}: EmployeeSearchFiltersProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Cari pegawai berdasarkan nama, NIP, NIK, atau unit..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={onImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={unitFilter} onValueChange={onUnitFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Unit</SelectItem>
                {unitOptions.map((unit) => (
                  <SelectItem key={unit.id} value={unit.nama_unit}>
                    {unit.nama_unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={pangkatFilter} onValueChange={onPangkatFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Pangkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pangkat</SelectItem>
                {pangkatOptions.map((pangkat) => (
                  <SelectItem key={pangkat.id} value={pangkat.kode}>
                    {pangkat.kode} - {pangkat.nama_pangkat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
                <SelectItem value="approaching_retirement">Mendekati Pensiun</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={onClearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
