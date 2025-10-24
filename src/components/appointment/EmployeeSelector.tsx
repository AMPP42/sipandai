// Temporary stub - will be reimplemented with new database structure

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
  return (
    <div className="p-4 text-center text-muted-foreground">
      <p>Pemilihan pegawai akan segera tersedia</p>
    </div>
  );
}

export default EmployeeSelector;
