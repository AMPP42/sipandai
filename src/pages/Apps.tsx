
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  Users,
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Apps() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const applications = [
    {
      id: 'mutasi',
      title: 'Pengajuan Berkas Usulan Mutasi',
      description: 'Sistem pengajuan mutasi pegawai dengan tracking timeline dan notifikasi real-time',
      icon: FileText,
      color: 'blue',
      features: ['Form pengajuan online', 'Upload dokumen Google Drive', 'Tracking status real-time', 'Notifikasi otomatis'],
      stats: { total: 23, pending: 5, approved: 15 },
      available: true,
      route: '/apps/pengajuan-mutasi'
    },
    {
      id: 'pangkat',
      title: 'Pengajuan Kenaikan Pangkat',
      description: 'Validasi syarat otomatis dan checklist dokumen persyaratan kenaikan pangkat',
      icon: TrendingUp,
      color: 'green',
      features: ['Validasi syarat otomatis', 'Checklist dokumen', 'Kalkulasi masa kerja', 'Integrasi database kepangkatan'],
      stats: { total: 18, pending: 3, approved: 12 },
      available: true,
      route: '/apps/kenaikan-pangkat'
    },
    {
      id: 'pensiun',
      title: 'Administrasi & Reminder Pensiun',
      description: 'Auto-reminder dan dashboard countdown persiapan pensiun pegawai',
      icon: Calendar,
      color: 'orange',
      features: ['Auto-reminder pensiun', 'Dashboard countdown', 'Checklist persiapan', 'Generate surat keterangan'],
      stats: { total: 47, reminder: 12, processed: 5 },
      available: true,
      route: '/apps/reminder-pensiun'
    },
    {
      id: 'konsultasi',
      title: 'Konsultasi & Bimbingan SDM',
      description: 'Ticketing system, live chat, dan knowledge base untuk konsultasi kepegawaian',
      icon: MessageSquare,
      color: 'purple',
      features: ['Ticketing system', 'Live chat konselor', 'Knowledge base FAQ', 'Rating & feedback'],
      stats: { active: 8, resolved: 45, pending: 3 },
      available: true,
      route: '/apps/konsultasi-sdm'
    }
  ];

  const handleOpenApp = (app: any) => {
    if (app.available && app.route) {
      navigate(app.route);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-lg">
                <FileText className="w-6 h-6 text-brand-600" />
              </div>
              Portal Aplikasi SIPANDAI
            </h1>
            <p className="text-gray-600 mt-2">
              Akses semua aplikasi administrasi ASN dalam satu portal terintegrasi
            </p>
          </div>
          <Badge className="bg-brand-100 text-brand-700 border-brand-200">
            {applications.filter(app => app.available).length} Aplikasi Aktif
          </Badge>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {applications.map((app) => (
          <Card key={app.id} className="hover:shadow-lg transition-all duration-200 border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-${app.color}-100`}>
                    <app.icon className={`w-6 h-6 text-${app.color}-600`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{app.title}</CardTitle>
                    <CardDescription className="mt-2 text-sm">
                      {app.description}
                    </CardDescription>
                  </div>
                </div>
                {app.available ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Segera
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Features */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Fitur Utama:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {app.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Statistik:</h4>
                <div className="flex gap-4 text-xs">
                  {Object.entries(app.stats).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="font-bold text-gray-900">{value}</p>
                      <p className="text-gray-600 capitalize">
                        {key === 'total' ? 'Total' : 
                         key === 'pending' ? 'Pending' : 
                         key === 'approved' ? 'Disetujui' : 
                         key === 'reminder' ? 'Reminder' : 
                         key === 'processed' ? 'Diproses' :
                         key === 'active' ? 'Aktif' :
                         key === 'resolved' ? 'Selesai' : key}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  className="btn-primary flex-1" 
                  disabled={!app.available}
                  size="sm"
                  onClick={() => handleOpenApp(app)}
                >
                  Buka Aplikasi
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" size="sm">
                  Info Lengkap
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Info */}
      <Card className="border-brand-200 bg-brand-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-brand-100 rounded-lg flex-shrink-0">
              <Users className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-900 mb-2">Sistem Terintegrasi</h3>
              <p className="text-brand-800 text-sm mb-4">
                Semua aplikasi terhubung dengan database pegawai terpusat dan menggunakan sistem Single Sign-On (SSO) 
                untuk kemudahan akses. Data yang dimasukkan di satu aplikasi akan tersinkronisasi otomatis dengan aplikasi lainnya.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white text-brand-700 border-brand-300">Database Terpusat</Badge>
                <Badge className="bg-white text-brand-700 border-brand-300">Single Sign-On</Badge>
                <Badge className="bg-white text-brand-700 border-brand-300">Real-time Sync</Badge>
                <Badge className="bg-white text-brand-700 border-brand-300">Multi-role Access</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Need Help */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Butuh Bantuan?</h3>
              <p className="text-gray-600 text-sm">
                Tim support SIPANDAI siap membantu Anda menggunakan semua fitur dengan optimal.
              </p>
            </div>
            <Button className="btn-secondary">
              <MessageSquare className="w-4 h-4 mr-2" />
              Hubungi Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
