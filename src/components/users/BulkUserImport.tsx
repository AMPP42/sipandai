// Temporary stub - will be reimplemented with new database structure

interface BulkUserImportProps {
  onUploadComplete?: () => void;
  onClose?: () => void;
}

export default function BulkUserImport({ onUploadComplete, onClose }: BulkUserImportProps) {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <p>Import user massal akan segera tersedia</p>
    </div>
  );
}
