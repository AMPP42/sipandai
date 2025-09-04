import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';

interface ExcelUploadProps {
  onUploadComplete: () => void;
  onClose: () => void;
}

interface EmployeeData {
  nama: string;
  nip?: string;
  nik?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
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
}

export default function ExcelUpload({ onUploadComplete, onClose }: ExcelUploadProps) {
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
        nip: '19800101 200801 1 001',
        nik: '1234567890123456',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '1980-01-01',
        jenis_kelamin: 'L',
        agama: 'Islam',
        status_pernikahan: 'Menikah',
        pendidikan_terakhir: 'S1',
        handphone: '081234567890',
        email: 'john.doe@email.com',
        alamat: 'Jl. Sudirman No. 1 Jakarta',
        unit: 'BKPSDM',
        kriteria_asn: 'PNS',
        jabatan: 'Analis Kepegawaian',
        grade_kelas_jabatan: 'III/a',
        tmt_jabatan_terakhir: '2020-01-01',
        pangkat: 'Penata Muda',
        tmt_pangkat_terakhir: '2020-01-01',
        tmt_cpns: '2008-01-01',
        tmt_pns: '2010-01-01'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Data Pegawai');
    
    // Set column widths
    const colWidths = [
      { wch: 20 }, // nama
      { wch: 20 }, // nip
      { wch: 20 }, // nik
      { wch: 15 }, // tempat_lahir
      { wch: 12 }, // tanggal_lahir
      { wch: 12 }, // jenis_kelamin
      { wch: 10 }, // agama
      { wch: 15 }, // status_pernikahan
      { wch: 20 }, // pendidikan_terakhir
      { wch: 15 }, // handphone
      { wch: 25 }, // email
      { wch: 30 }, // alamat
      { wch: 20 }, // unit
      { wch: 15 }, // kriteria_asn
      { wch: 25 }, // jabatan
      { wch: 15 }, // grade_kelas_jabatan
      { wch: 15 }, // tmt_jabatan_terakhir
      { wch: 20 }, // pangkat
      { wch: 15 }, // tmt_pangkat_terakhir
      { wch: 12 }, // tmt_cpns
      { wch: 12 }, // tmt_pns
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'Template_Data_Pegawai.xlsx');
  };

  const validateEmployeeData = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!data.nama || typeof data.nama !== 'string' || data.nama.trim() === '') {
      errors.push('Nama wajib diisi');
    }
    
    if (data.jenis_kelamin && !['L', 'P'].includes(data.jenis_kelamin)) {
      errors.push('Jenis kelamin harus L atau P');
    }
    
    if (data.kriteria_asn && !['PNS', 'PPPK'].includes(data.kriteria_asn)) {
      errors.push('Kriteria ASN harus PNS atau PPPK');
    }
    
    // Validate date formats
    const dateFields = ['tanggal_lahir', 'tmt_jabatan_terakhir', 'tmt_pangkat_terakhir', 'tmt_cpns', 'tmt_pns'];
    dateFields.forEach(field => {
      if (data[field] && data[field] !== '') {
        const date = new Date(data[field]);
        if (isNaN(date.getTime())) {
          errors.push(`${field} format tanggal tidak valid (gunakan YYYY-MM-DD)`);
        }
      }
    });
    
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
        const validation = validateEmployeeData(row);
        if (!validation.isValid) {
          failedCount++;
          errors.push(`Baris ${i + 2}: ${validation.errors.join(', ')}`);
          continue;
        }

        try {
          // Prepare employee data
          const employeeData: EmployeeData = {
            nama: row.nama?.toString().trim(),
            nip: row.nip ? row.nip.toString().trim() : undefined,
            nik: row.nik ? row.nik.toString().trim() : undefined,
            tempat_lahir: row.tempat_lahir ? row.tempat_lahir.toString().trim() : undefined,
            tanggal_lahir: row.tanggal_lahir ? new Date(row.tanggal_lahir).toISOString().split('T')[0] : undefined,
            jenis_kelamin: row.jenis_kelamin ? row.jenis_kelamin.toString().trim() : undefined,
            agama: row.agama ? row.agama.toString().trim() : undefined,
            status_pernikahan: row.status_pernikahan ? row.status_pernikahan.toString().trim() : undefined,
            pendidikan_terakhir: row.pendidikan_terakhir ? row.pendidikan_terakhir.toString().trim() : undefined,
            handphone: row.handphone ? row.handphone.toString().trim() : undefined,
            email: row.email ? row.email.toString().trim() : undefined,
            alamat: row.alamat ? row.alamat.toString().trim() : undefined,
            unit: row.unit ? row.unit.toString().trim() : undefined,
            kriteria_asn: row.kriteria_asn ? row.kriteria_asn.toString().trim() : undefined,
            jabatan: row.jabatan ? row.jabatan.toString().trim() : undefined,
            grade_kelas_jabatan: row.grade_kelas_jabatan ? row.grade_kelas_jabatan.toString().trim() : undefined,
            tmt_jabatan_terakhir: row.tmt_jabatan_terakhir ? new Date(row.tmt_jabatan_terakhir).toISOString().split('T')[0] : undefined,
            pangkat: row.pangkat ? row.pangkat.toString().trim() : undefined,
            tmt_pangkat_terakhir: row.tmt_pangkat_terakhir ? new Date(row.tmt_pangkat_terakhir).toISOString().split('T')[0] : undefined,
            tmt_cpns: row.tmt_cpns ? new Date(row.tmt_cpns).toISOString().split('T')[0] : undefined,
            tmt_pns: row.tmt_pns ? new Date(row.tmt_pns).toISOString().split('T')[0] : undefined,
          };

          // Insert to database
          const { error } = await supabase
            .from('employees')
            .insert(employeeData);

          if (error) throw error;
          successCount++;

        } catch (dbError: any) {
          failedCount++;
          errors.push(`Baris ${i + 2}: ${dbError.message}`);
        }

        // Small delay to prevent overwhelming the database
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setUploadResult({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10) // Show only first 10 errors
      });

      if (successCount > 0) {
        toast({
          title: "Upload berhasil",
          description: `${successCount} data pegawai berhasil diupload`,
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
      // Reset file input
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
            Upload Data Pegawai Excel
          </CardTitle>
          <CardDescription>
            Upload data pegawai dalam format Excel. Download template terlebih dahulu untuk format yang benar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Download Template */}
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. Download Template</h3>
              <Button onClick={downloadTemplate} variant="outline" className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Download Template Excel
              </Button>
            </div>

            {/* Upload File */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. Upload File Excel</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
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
                  <span>Mengupload data...</span>
                  <span>{progress}%</span>
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
                    <p className={uploadResult.failed > 0 ? "text-yellow-800" : "text-green-800"}>
                      Upload selesai: {uploadResult.success} berhasil, {uploadResult.failed} gagal
                    </p>
                    {uploadResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-red-800 mb-1">Error:</p>
                        <ul className="text-sm text-red-700 space-y-1">
                          {uploadResult.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                          {uploadResult.errors.length === 10 && uploadResult.failed > 10 && (
                            <li>• ... dan {uploadResult.failed - 10} error lainnya</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={onClose} variant="outline">
                Tutup
              </Button>
              {uploadResult && uploadResult.success > 0 && (
                <Button onClick={onUploadComplete}>
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