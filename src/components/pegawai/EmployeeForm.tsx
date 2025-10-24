interface EmployeeFormProps {
  employee?: any;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function EmployeeForm({ onCancel }: EmployeeFormProps) {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <p>Form pegawai akan diimplementasi ulang dengan struktur database baru</p>
      {onCancel && (
        <button 
          onClick={onCancel} 
          className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Kembali
        </button>
      )}
    </div>
  );
}
