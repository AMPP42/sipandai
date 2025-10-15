import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';

interface BulkUserImportProps {
  onUploadComplete: () => void;
  onClose: () => void;
}

interface UserData {
  nama: string;
  email: string;
  role: 'admin_pusat' | 'admin_unit';
  unit?: string;
}

export default function BulkUserImport({ onUploadComplete, onClose }: BulkUserImportProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const templateData = [
      {
        nama: 'John Doe',
        email: 'john.doe@pemkab.go.id',
        role: 'admin_unit',
        unit: 'BKPSDM'
      },
      {
        nama: 'Jane Smith',
        email: 'jane.smith@pemkab.go.id',
        role: 'admin_pusat',
        unit: ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Data User');
    
    const colWidths = [
      { wch: 25 }, // nama
      { wch: 30 }, // email
      { wch: 15 }, // role
      { wch: 25 }, // unit
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'Template_Data_User.xlsx');
  };

  const validateUserData = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!data.nama || typeof data.nama !== 'string' || data.nama.trim() === '') {
      errors.push('Nama wajib diisi');
    }

    if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
      errors.push('Email wajib diisi');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Format email tidak valid');
      }
    }
    
    if (!data.role || !['admin_pusat', 'admin_unit'].includes(data.role)) {
      errors.push('Role harus admin_pusat atau admin_unit');
    }

    if (data.role === 'admin_unit' && (!data.unit || data.unit.trim() === '')) {
      errors.push('Unit wajib diisi untuk role admin_unit');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setUploadResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        throw new Error('File Excel kosong atau tidak ada data');
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        setProgress(Math.round(((i + 1) / jsonData.length) * 100));

        // Validate data
        const validation = validateUserData(row);
        if (!validation.isValid) {
          failedCount++;
          errors.push(`Baris ${i + 2}: ${validation.errors.join(', ')}`);
          continue;
        }

        try {
          const userData: UserData = {
            nama: row.nama.toString().trim(),
            email: row.email.toString().trim().toLowerCase(),
            role: row.role,
            unit: row.unit ? row.unit.toString().trim() : undefined
          };

          // Check if email already exists
          const { data: existingProfiles } = await supabase
            .from('profiles')
            .select('name')
            .eq('name', userData.nama);

          if (existingProfiles && existingProfiles.length > 0) {
            throw new Error(`User dengan nama ${userData.nama} sudah ada`);
          }

          // Generate user ID
          const userId = crypto.randomUUID();

          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: userId,
              name: userData.nama,
              role: userData.role,
              unit: userData.unit || null
            }]);

          if (profileError) throw profileError;

          // Create role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([{
              user_id: userId,
              role: userData.role,
              unit: userData.unit || null
            }]);

          if (roleError) {
            // Rollback profile creation
            await supabase.from('profiles').delete().eq('id', userId);
            throw roleError;
          }

          // Log audit trail
          await supabase.from('audit_logs').insert([{
            action: 'CREATE',
            entity: 'user',
            entity_id: userId,
            actor_id: (await supabase.auth.getUser()).data.user?.id,
            meta: {
              name: userData.nama,
              role: userData.role,
              unit: userData.unit,
              source: 'bulk_import'
            }
          }]);

          successCount++;

        } catch (dbError: any) {
          failedCount++;
          errors.push(`Baris ${i + 2} (${row.nama}): ${dbError.message}`);
        }

        // Small delay to prevent overwhelming the database
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setUploadResult({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10)
      });

      if (successCount > 0) {
        toast({
          title: "Upload berhasil",
          description: `${successCount} user berhasil ditambahkan. User perlu mendaftar dengan email masing-masing.`,
        });
        onUploadComplete();
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Terjadi kesalahan saat upload file',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import User Massal (Excel)
          </CardTitle>
          <CardDescription>
            Upload data user dalam format Excel. Download template terlebih dahulu untuk format yang benar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4">
            {/* Download Template */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. Download Template</h3>
              <Button onClick={downloadTemplate} variant="outline" className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Download Template Excel
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Template berisi kolom: <strong>nama, email, role, unit</strong>
              </p>
            </div>

            {/* Upload File */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. Upload File Excel</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-500 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="user-excel-upload"
                />
                <label
                  htmlFor="user-excel-upload"
                  className={`cursor-pointer ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    {uploading ? 'Mengupload...' : 'Klik untuk pilih file Excel'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Format yang didukung: .xlsx, .xls
                  </p>
                </label>
              </div>
            </div>

            {/* Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Mengupload data user...</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <Alert className={uploadResult.failed > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
                {uploadResult.failed > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className={uploadResult.failed > 0 ? "text-yellow-800 font-medium" : "text-green-800 font-medium"}>
                      Upload selesai: {uploadResult.success} berhasil, {uploadResult.failed} gagal
                    </p>
                    {uploadResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-red-800 mb-1">Error:</p>
                        <ul className="text-sm text-red-700 space-y-1 max-h-48 overflow-y-auto">
                          {uploadResult.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                          {uploadResult.errors.length === 10 && uploadResult.failed > 10 && (
                            <li className="font-medium">• ... dan {uploadResult.failed - 10} error lainnya</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={onClose} variant="outline">
                Tutup
              </Button>
              {uploadResult && uploadResult.success > 0 && (
                <Button onClick={onUploadComplete} className="btn-primary">
                  Refresh Data
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
