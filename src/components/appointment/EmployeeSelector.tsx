import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Employee {
  id: string;
  nama: string;
  nip: string;
  unit: string;
  email: string;
  handphone: string;
}

interface EmployeeSelectorProps {
  value: string;
  onSelect: (employee: Employee | null) => void;
}

export function EmployeeSelector({ value, onSelect }: EmployeeSelectorProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadEmployees();
  }, [user]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      // Build query based on user role
      let query = supabase
        .from('employees')
        .select('id, nama, nip, unit, email, handphone')
        .order('nama');
      
      // If user is admin_unit, filter by their unit
      if (user?.role === 'admin_unit' && user?.unit) {
        query = query.eq('unit', user.unit);
      }
      // If user is admin_pusat, load all employees (no filter)
      
      const { data, error } = await query;

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEmployee = employees.find(emp => emp.nip === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedEmployee ? (
            <span className="truncate">
              {selectedEmployee.nama} ({selectedEmployee.nip})
            </span>
          ) : (
            <span className="text-muted-foreground">Pilih pegawai...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Cari pegawai..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandEmpty>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="ml-2">Memuat data...</span>
              </div>
            ) : (
              "Pegawai tidak ditemukan"
            )}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredEmployees.map((employee) => (
              <CommandItem
                key={employee.id}
                value={`${employee.nama}-${employee.nip}`}
                onSelect={() => {
                  onSelect(employee.nip === value ? null : employee);
                  setOpen(false);
                  setSearchTerm("");
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === employee.nip ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{employee.nama}</span>
                  <span className="text-sm text-muted-foreground">
                    {employee.nip} • {employee.unit}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}