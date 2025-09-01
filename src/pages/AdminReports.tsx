
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  FileText,
  PieChart,
  LineChart
} from 'lucide-react';

export default function AdminReports() {
  const reportTypes = [
    {
      title: 'Laporan Pegawai',
      description: 'Statistik kepegawaian dan distribusi pegawai',
      icon: Users,
      color: 'blue',
      lastGenerated: '2024-01-15'
    },
    {
      title: 'Laporan Usulan',
      description: 'Analisis usulan mutasi dan kenaikan pangkat',
      icon: FileText,
      color: 'green',
      lastGenerated: '2024-01-14'
    },
    {
      title: 'Laporan Formasi',
      description: 'Analisis kebutuhan dan gap formasi jabatan',
      icon: BarChart3,
      color: 'purple',
      lastGenerated: '2024-01-13'
    },
    {
      title: 'Laporan Kinerja Sistem',
      description: 'Penggunaan aplikasi dan tingkat kepuasan user',
      icon: TrendingUp,
      color: 'orange',
      lastGenerated: '2024-01-12'
    }
  ];

  const quickStats = [
    { label: 'Total Laporan', value: '156', change: '+12%' },
    { label: 'Bulan Ini', value: '23', change: '+8%' },
    { label: 'Rata-rata Download', value: '45', change: '+15%' },
    { label: 'User Aktif', value: '28', change: '+5%' }
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-brand-600" />
              </div>
              Statistik & Laporan
            </h1>
            <p className="text-gray-600 mt-2">
              Analisis data dan generate laporan komprehensif sistem SIPANDAI
            </p>
          </div>
          <Button className="btn-primary">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-brand-600" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-${report.color}-100`}>
                    <report.icon className={`w-6 h-6 text-${report.color}-600`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  Terakhir dibuat: {new Date(report.lastGenerated).toLocaleDateString('id-ID')}
                </div>
                <Badge className="bg-green-100 text-green-700">
                  Tersedia
                </Badge>
              </div>
              <div className="flex gap-3">
                <Button className="btn-primary flex-1">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Lihat Dashboard
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-brand-600" />
            Dashboard Analitik
          </CardTitle>
          <CardDescription>
            Visualisasi data real-time sistem SIPANDAI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Distribusi Pegawai</h4>
              <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <PieChart className="w-12 h-12 mx-auto mb-2" />
                  <p>Chart akan ditampilkan di sini</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Trend Usulan</h4>
              <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <LineChart className="w-12 h-12 mx-auto mb-2" />
                  <p>Chart akan ditampilkan di sini</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Penggunaan Aplikasi</h4>
              <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>Chart akan ditampilkan di sini</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" />
            Jadwal Laporan Otomatis
          </CardTitle>
          <CardDescription>
            Konfigurasi laporan yang dibuat secara otomatis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Laporan Bulanan Kepegawaian</h4>
                <p className="text-sm text-gray-600">Setiap tanggal 1, pukul 08:00</p>
              </div>
              <Badge className="bg-green-100 text-green-700">Aktif</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Laporan Mingguan Usulan</h4>
                <p className="text-sm text-gray-600">Setiap Senin, pukul 09:00</p>
              </div>
              <Badge className="bg-green-100 text-green-700">Aktif</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Laporan Harian Sistem</h4>
                <p className="text-sm text-gray-600">Setiap hari, pukul 23:00</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-700">Pause</Badge>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <Button className="btn-secondary">
              <Calendar className="w-4 h-4 mr-2" />
              Kelola Jadwal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
