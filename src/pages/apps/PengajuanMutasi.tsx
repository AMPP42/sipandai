import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText } from 'lucide-react';

export default function PengajuanMutasi() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect to the new integrated system after 3 seconds
    const timer = setTimeout(() => {
      navigate('/apps/pengajuan-mutasi-terpadu');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-3 text-2xl">
              <FileText className="w-8 h-8 text-primary" />
              Pengajuan Mutasi Telah Dipindahkan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-lg">
              Sistem pengajuan mutasi telah diintegrasikan dengan sistem yang lebih lengkap.
              Anda akan dialihkan secara otomatis dalam 3 detik.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Fitur Terbaru:</h3>
              <ul className="text-left space-y-2 max-w-md mx-auto">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Pemilihan pegawai dari database
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Pemilihan formasi jabatan tujuan
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Upload dokumen yang lebih terstruktur
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Tracking progress yang lebih detail
                </li>
              </ul>
            </div>

            <Button 
              onClick={() => navigate('/apps/pengajuan-mutasi-terpadu')}
              className="text-lg px-8 py-3"
            >
              Lanjut ke Sistem Baru
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}