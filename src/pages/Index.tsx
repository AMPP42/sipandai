
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Shield, 
  Users, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Star,
  Zap,
  Database,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalApplications: 0,
    satisfactionRate: 0,
    activeTickets: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total employees
        const { count: employeesCount } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true });

        // Fetch total applications
        const { count: applicationsCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true });

        // Fetch consultation tickets with ratings
        const { data: ticketsData } = await supabase
          .from('consultation_tickets')
          .select('rating')
          .not('rating', 'is', null);

        // Calculate average satisfaction rate
        const avgRating = ticketsData && ticketsData.length > 0
          ? ticketsData.reduce((sum, t) => sum + (t.rating || 0), 0) / ticketsData.length
          : 0;
        const satisfactionRate = Math.round((avgRating / 5) * 100);

        // Fetch active consultation tickets
        const { count: activeTicketsCount } = await supabase
          .from('consultation_tickets')
          .select('*', { count: 'exact', head: true })
          .in('status', ['open', 'in_progress']);

        setStats({
          totalEmployees: employeesCount || 0,
          totalApplications: applicationsCount || 0,
          satisfactionRate: satisfactionRate || 0,
          activeTickets: activeTicketsCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: Shield,
      title: 'Single Sign-On (SSO)',
      description: 'Akses semua aplikasi dengan satu akun yang terintegrasi'
    },
    {
      icon: Database,
      title: 'Database Terpusat',
      description: 'Data pegawai tersinkronisasi di semua aplikasi'
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Akses yang disesuaikan dengan peran dan tanggung jawab'
    },
    {
      icon: Zap,
      title: 'Workflow Otomatis',
      description: 'Proses persetujuan yang efisien dan terstruktur'
    }
  ];

  const applications = [
    {
      title: 'Pengajuan Mutasi',
      description: 'Proses pengajuan mutasi pegawai dengan tracking real-time',
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Kenaikan Pangkat',
      description: 'Validasi otomatis syarat dan dokumen kenaikan pangkat',
      icon: Star,
      color: 'green'
    },
    {
      title: 'Administrasi Pensiun',
      description: 'Auto-reminder dan persiapan administrasi pensiun',
      icon: Clock,
      color: 'orange'
    },
    {
      title: 'Konsultasi SDM',
      description: 'Platform konsultasi dan bimbingan masalah kepegawaian',
      icon: MessageSquare,
      color: 'purple'
    }
  ];

  const benefits = [
    'Efisiensi waktu pemrosesan hingga 60%',
    'Akurasi data pegawai meningkat 95%', 
    'Transparansi proses administrasi',
    'Pengurangan biaya operasional',
    'Pelayanan 24/7 online',
    'Integrasi seamless antar unit'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-brand-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-600 rounded-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SIPANDAI</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Sistem Pelayanan Administrasi Digital ASN</p>
              </div>
            </div>
            <Link to="/auth">
              <Button className="btn-primary">
                Masuk ke Portal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="bg-brand-100 text-brand-700 border-brand-200 mb-6">
            ✨ Portal Administrasi ASN Terdepan
          </Badge>
          
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Sistem Pelayanan<br />
            <span className="gradient-brand bg-clip-text text-transparent">
              Administrasi Digital ASN
            </span><br />
            Terintegrasi
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Platform terpusat yang mengintegrasikan semua aplikasi administrasi ASN dengan sistem Single Sign-On (SSO), 
            memberikan akses seamless dan efisien untuk seluruh kebutuhan kepegawaian.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/auth">
              <Button size="lg" className="btn-primary text-lg px-8 py-3">
                Mulai Sekarang
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Pelajari Lebih Lanjut
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-3xl font-bold text-brand-600">
                {loading ? '...' : stats.totalEmployees.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Pegawai Terdaftar</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-brand-600">
                {loading ? '...' : stats.totalApplications.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Pengajuan Diproses</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-brand-600">
                {loading ? '...' : `${stats.satisfactionRate}%`}
              </p>
              <p className="text-sm text-gray-600">Tingkat Kepuasan</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-brand-600">
                {loading ? '...' : stats.activeTickets.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Konsultasi Aktif</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Fitur Unggulan SIPANDAI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Teknologi terdepan untuk administrasi ASN yang lebih efisien dan transparan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-200 border-gray-200">
                <CardContent className="p-6">
                  <div className="p-3 bg-brand-100 rounded-xl inline-block mb-4">
                    <feature.icon className="w-6 h-6 text-brand-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Applications Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Aplikasi Terintegrasi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Empat aplikasi utama dalam satu portal untuk memenuhi seluruh kebutuhan administrasi ASN
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {applications.map((app, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200 border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-${app.color}-100 rounded-xl flex-shrink-0`}>
                      <app.icon className={`w-6 h-6 text-${app.color}-600`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{app.title}</h3>
                      <p className="text-gray-600 mb-4">{app.description}</p>
                      <Button size="sm" className="btn-secondary">
                        Pelajari <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Mengapa Memilih SIPANDAI?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Transformasi digital untuk administrasi ASN yang lebih modern, efisien, dan transparan. 
                Bergabunglah dengan ribuan ASN yang telah merasakan kemudahan SIPANDAI.
              </p>
              
              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <Link to="/auth">
                <Button size="lg" className="btn-primary">
                  Mulai Gunakan SIPANDAI
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-8 text-white">
              <div className="space-y-6">
                <div className="text-center">
                  <Building2 className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Portal Terpusat</h3>
                  <p className="text-brand-100">
                    Satu pintu akses untuk semua kebutuhan administrasi ASN Anda
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white/10 rounded-lg p-4">
                    <Shield className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">Keamanan Terjamin</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <Zap className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">Proses Cepat</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Siap Memulai Transformasi Digital?
          </h2>
          <p className="text-xl text-brand-100 mb-8">
            Bergabunglah dengan SIPANDAI hari ini dan rasakan kemudahan administrasi ASN yang baru
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-white text-brand-600 hover:bg-gray-100 px-8 py-3">
                Daftar Sekarang
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-brand-600 px-8 py-3">
              Hubungi Tim Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="p-2 bg-brand-600 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">SIPANDAI</h3>
                <p className="text-sm text-gray-400">Sistem Administrasi ASN Digital</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">
                &copy; 2024 SIPANDAI. Dikembangkan untuk kemajuan administrasi ASN Indonesia.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
