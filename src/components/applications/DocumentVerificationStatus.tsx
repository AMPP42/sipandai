// Temporary stub - will be reimplemented with new database structure

interface Props {
  applicationId: string;
  applicationStatus?: string;
  compact?: boolean;
}

export default function DocumentVerificationStatus({ applicationId }: Props) {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <p>Fitur verifikasi dokumen akan segera tersedia</p>
    </div>
  );
}
