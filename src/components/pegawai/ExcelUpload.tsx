interface ExcelUploadProps {
  onUploadComplete?: () => void;
  onClose?: () => void;
}

export default function ExcelUpload({ onClose }: ExcelUploadProps) {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <p>Upload Excel pegawai akan diimplementasi ulang dengan struktur database baru</p>
      {onClose && (
        <button 
          onClick={onClose} 
          className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Kembali
        </button>
      )}
    </div>
  );
}
