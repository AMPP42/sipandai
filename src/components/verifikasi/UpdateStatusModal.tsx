interface UpdateStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: any;
  onSuccess?: () => void;
}

export default function UpdateStatusModal({ 
  open, 
  onOpenChange 
}: UpdateStatusModalProps) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background p-8 rounded-lg max-w-md">
        <p className="text-center text-muted-foreground mb-4">
          Update status akan diimplementasi ulang dengan struktur database baru
        </p>
        <button 
          onClick={() => onOpenChange(false)} 
          className="w-full px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
