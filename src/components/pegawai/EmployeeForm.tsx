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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { Icons } from "../icons";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Database } from "@/types/supabase";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

interface EmployeeFormProps {
  employee?: any;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function EmployeeForm({ employee, onSave, onCancel }: EmployeeFormProps) {
  const [isMutating, setIsMutating] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: employee?.tmt_cpns ? new Date(employee?.tmt_cpns) : undefined,
    to: employee?.tmt_pns ? new Date(employee?.tmt_pns) : undefined,
  });
  const supabase = useSupabaseClient<Database>()

  const form = useForm({
    defaultValues: {
      nama: employee?.nama || "",
      nip: employee?.nip || "",
      email: employee?.email || "",
      no_hp: employee?.no_hp || "",
      tempat_lahir: employee?.tempat_lahir || "",
      tanggal_lahir: employee?.tanggal_lahir || "",
      jenis_kelamin: employee?.jenis_kelamin || "",
      alamat: employee?.alamat || "",
      pendidikan_terakhir: employee?.pendidikan_terakhir || "",
      kriteria_asn: employee?.kriteria_asn || "",
      grade_kelas_jabatan: employee?.grade_kelas_jabatan || "",
      jabatan_terakhir: employee?.jabatan_terakhir || "",
      tmt_jabatan_terakhir: employee?.tmt_jabatan_terakhir || "",
      pangkat: employee?.pangkat || "",
      tmt_pangkat_terakhir: employee?.tmt_pangkat_terakhir || "",
      tmt_cpns: employee?.tmt_cpns || "",
      tmt_pns: employee?.tmt_pns || "",
      unit: employee?.unit || "",
    },
  });

  async function onSubmit(values: any) {
    setIsMutating(true);
    try {
      if (employee) {
        const { error } = await supabase
          .from("employees")
          .update(values)
          .eq("id", employee.id);

        if (error) throw error;
        toast.success("Pegawai berhasil diubah!");
      } else {
        const { error } = await supabase
          .from("employees")
          .insert({ ...values });

        if (error) throw error;
        toast.success("Pegawai berhasil ditambahkan!");
      }

      onSave?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama</FormLabel>
                <FormControl>
                  <Input placeholder="Nama lengkap" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIP</FormLabel>
                <FormControl>
                  <Input placeholder="NIP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="no_hp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>No. HP</FormLabel>
                <FormControl>
                  <Input placeholder="Nomor HP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tempat_lahir"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Lahir</FormLabel>
                <FormControl>
                  <Input placeholder="Tempat lahir" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tanggal_lahir"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Lahir</FormLabel>
                <FormControl>
                  <Input placeholder="Tanggal lahir" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jenis_kelamin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Kelamin</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="alamat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat</FormLabel>
                <FormControl>
                  <Textarea placeholder="Alamat lengkap" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pendidikan_terakhir"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pendidikan Terakhir</FormLabel>
                <FormControl>
                  <Input placeholder="Pendidikan terakhir" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="kriteria_asn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kriteria ASN</FormLabel>
                <FormControl>
                  <Input placeholder="Kriteria ASN" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="grade_kelas_jabatan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grade Kelas Jabatan</FormLabel>
                <FormControl>
                  <Input placeholder="Grade kelas jabatan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jabatan_terakhir"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jabatan Terakhir</FormLabel>
                <FormControl>
                  <Input placeholder="Jabatan terakhir" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tmt_jabatan_terakhir"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TMT Jabatan Terakhir</FormLabel>
                <FormControl>
                  <Input placeholder="TMT jabatan terakhir" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pangkat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pangkat</FormLabel>
                <FormControl>
                  <Input placeholder="Pangkat" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tmt_pangkat_terakhir"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TMT Pangkat Terakhir</FormLabel>
                <FormControl>
                  <Input placeholder="TMT pangkat terakhir" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="col-span-2">
            <FormItem>
              <FormLabel>TMT CPNS - PNS</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !date?.from && "text-muted-foreground"
                      )}
                    >
                      {date?.from ? (
                        date.to ? (
                          `${format(date.from, "PPP")} - ${format(date.to, "PPP")}`
                        ) : (
                          format(date.from, "PPP")
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Pilih tanggal mulai dan tanggal selesai.
              </FormDescription>
              <FormMessage />
            </FormItem>
          </div>
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input placeholder="Unit" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Hapus</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Apakah anda yakin ingin
                  menghapus pegawai ini?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction>Hapus</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" disabled={isMutating}>
            {isMutating && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Simpan
          </Button>
        </div>
      </form>
    </Form>
  );
}
