import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import * as XLSX from "xlsx";
import { useEffect, useState } from "react";

interface EmployeeData {
  nip: string;
  nama: string;
  email: string;
  unit: string;
  jabatan: string;
  pangkat: string;
  golongan: string;
  pendidikan_terakhir: string;
  tmt_cpns: string;
  tmt_pns: string;
  tmt_jabatan_terakhir: string;
  tmt_pangkat_terakhir: string;
  grade_kelas_jabatan: string;
  kriteria_asn: string;
}

interface ExcelUploadProps {
  onUploadComplete?: () => void;
  onClose?: () => void;
}

export default function ExcelUpload({ onUploadComplete, onClose }: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (file) {
      handleFile();
    }
  }, [file]);

  const handleFile = async () => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e: any) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: EmployeeData[] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      }).slice(1);

      const headers = [
        "nip",
        "nama",
        "email",
        "unit",
        "jabatan",
        "pangkat",
        "golongan",
        "pendidikan_terakhir",
        "tmt_cpns",
        "tmt_pns",
        "tmt_jabatan_terakhir",
        "tmt_pangkat_terakhir",
        "grade_kelas_jabatan",
        "kriteria_asn",
      ];

      const formattedJsonData: EmployeeData[] = jsonData.map((row: any) => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || null;
        });
        return obj as EmployeeData;
      });

      setData(formattedJsonData);
    };

    reader.readAsBinaryString(file);
  };

  const uploadData = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("employees").insert(data);

      if (error) {
        console.error("Error inserting data:", error);
        toast({
          title: "Gagal mengunggah data",
          description: "Terjadi kesalahan saat menyimpan data ke database.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Berhasil",
          description: "Data berhasil diunggah ke database.",
        });
        onUploadComplete?.();
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Kesalahan tak terduga",
        description: "Terjadi kesalahan tak terduga.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-[500px]">
      <CardHeader>
        <CardTitle>Unggah Data Pegawai dari Excel</CardTitle>
        <CardDescription>
          Pilih file Excel untuk mengunggah data pegawai.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">File Excel</Label>
          <Input
            id="excel"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        {data.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default">
                Unggah Data ({data.length} baris)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Unggah</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin mengunggah data ini ke database?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={uploadData} disabled={loading}>
                  {loading ? (
                    <span className="animate-spin">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    </span>
                  ) : (
                    "Unggah"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
