
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { user } = useAuth();

  const statsCards = user?.role === 'admin_pusat' 
    ? [
        { title: 'Total Pegawai', value: '2,847', icon: Users, color: 'blue', trend: '+12 bulan ini' },
        { title: 'Usulan Pending', value: '23', icon: Clock, color: 'yellow', trend: '↑ 3 dari kemarin' },
        { title: 'Usulan Selesai', value: '156', icon: CheckCircle, color: 'green', trend: '↑ 15% bulan ini' },
        { title: 'Konsultasi Aktif', value: '8', icon: MessageSquare, color: 'purple', trend: '2 belum dijawab' }
      ]
    : [
        { title: 'Usulan Saya', value: '12', icon: FileText, color: 'blue', trend: '3 sedang diproses' },
        { title: 'Menunggu Review', value: '5', icon: Clock, color: 'yellow', trend: '2 perlu revisi' },
        { title: 'Telah Disetujui', value: '7', icon: CheckCircle, color: 'green', trend: '↑ 2 minggu ini' },
        { title: 'Konsultasi', value: '3', icon: MessageSquare, color: 'purple', trend: '1 belum dibaca' }
      ];

  const quickActions = user?.role === 'admin_pusat'
    ? [
        { title: 'Verifikasi Usulan', desc: 'Review dan verifikasi usulan yang masuk', href: '/verifikasi', icon: CheckCircle, badge: '3 baru' },
        { title: 'Database Pegawai', desc: 'Kelola data master pegawai', href: '/admin/pegawai', icon: Users },
        { title: 'Laporan Statistik', desc: 'Lihat laporan dan analisis data', href: '/admin/reports', icon: BarChart3 },
        { title: 'User Management', desc: 'Kelola akun pengguna sistem', href: '/admin/users', icon: Users }
      ]
    : [
        { title: 'Pengajuan Mutasi', desc: 'Ajukan usulan mutasi pegawai', href: '/apps/mutasi', icon: FileText },
        { title: 'Kenaikan Pangkat', desc: 'Ajukan usulan kenaikan pangkat', href: '/apps/pangkat', icon: TrendingUp },
        { title: 'Konsultasi SDM', desc: 'Konsultasi masalah kepegawaian', href: '/apps/konsultasi', icon: MessageSquare },
        { title: 'Administrasi Pensiun', desc: 'Kelola administrasi pensiun', href: '/apps/pensiun', icon: Calendar }
      ];

  const recentActivities = [
    { 
      title: 'Usulan Mutasi Disetujui', 
      desc: 'Ahmad Susanto - Mutasi ke Dinas Pendidikan', 
      time: '2 jam lalu',
      status: 'approved'
    },
    { 
      title: 'Kenaikan Pangkat Pending', 
      desc: 'Siti Rahayu - Menunggu verifikasi dokumen', 
      time: '4 jam lalu',
      status: 'pending'
    },
    { 
      title: 'Konsultasi Baru', 
      desc: 'Pertanyaan tentang cuti melahirkan', 
      time: '1 hari lalu',
      status: 'new'
    },
    { 
      title: 'Reminder Pensiun', 
      desc: 'Budi Santoso akan pensiun dalam 6 bulan', 
      time: '2 hari lalu',
      status: 'warning'
    }
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Selamat datang, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'admin_pusat' 
                ? 'Kelola sistem administrasi ASN dengan efisien' 
                : `Akses aplikasi administrasi ASN untuk ${user?.unit || 'unit kerja Anda'}`
              }
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <Badge className="mt-1 bg-brand-100 text-brand-700 border-brand-200">
              {user?.role === 'admin_pusat' ? 'Admin Pusat' : 'Admin Unit'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.trend}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              Aksi Cepat
            </CardTitle>
            <CardDescription>
              {user?.role === 'admin_pusat' 
                ? 'Akses cepat ke fungsi administrasi utama'
                : 'Mulai proses administrasi dengan cepat'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <div key={index} className="app-card">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-brand-100 rounded-lg flex-shrink-0">
                      <action.icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">{action.title}</h3>
                        {action.badge && (
                          <Badge className="bg-red-100 text-red-700 text-xs px-2 py-0.5">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-3">{action.desc}</p>
                      <Button size="sm" className="btn-secondary text-xs">
                        Buka <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" />
              Aktivitas Terbaru
            </CardTitle>
            <CardDescription>
              Timeline aktivitas sistem terbaru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.status === 'approved' ? 'bg-green-500' :
                    activity.status === 'pending' ? 'bg-yellow-500' :
                    activity.status === 'new' ? 'bg-blue-500' :
                    'bg-orange-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                    <p className="text-gray-600 text-xs mt-0.5">{activity.desc}</p>
                    <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 text-sm">
              Lihat Semua Aktivitas
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status Banner */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900 text-sm">Sistem Berjalan Normal</p>
              <p className="text-green-700 text-xs">
                Semua layanan SIPANDAI beroperasi dengan baik. Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
