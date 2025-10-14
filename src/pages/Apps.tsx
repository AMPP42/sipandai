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
  CheckCircle,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessibleApplications, canViewStats, APPLICATIONS } from '@/lib/permissions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Apps() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get applications accessible to current user
  const accessibleApps = getAccessibleApplications(user);

  // Fetch statistics based on user role and unit
  const { data: stats } = useQuery({
    queryKey: ['app-stats', user?.id, user?.unit],
    queryFn: async () => {
      if (!user) return null;

      const isAdminPusat = user.role === 'admin_pusat';
      const userUnit = user.unit;

      // Build query based on role
      let applicationsQuery = supabase
        .from('applications')
        .select('jenis, status, submitter_unit');

      // Filter by unit for admin_unit
      if (!isAdminPusat && userUnit) {
        applicationsQuery = applicationsQuery.eq('submitter_unit', userUnit);
      }

      const { data: applications } = await applicationsQuery;

    // Calculate stats for each app type - ensure all data is dynamic from database
    const mutasiApps = applications?.filter(a => a.jenis === 'mutasi' || a.jenis === 'mutasi_terpadu') || [];
    const pangkatApps = applications?.filter(a => a.jenis === 'kenaikan_pangkat') || [];
    const pensiunApps = applications?.filter(a => a.jenis === 'pensiun') || [];

    // Helper function to count by status - dynamically count all statuses
    const countByStatus = (apps: any[]) => {
      const total = apps.length;
      const submitted = apps.filter(a => a.status === 'submitted').length;
      const inProgress = apps.filter(a => ['in_progress', 'biro_osdma_review', 'revision_needed'].includes(a.status)).length;
      const completed = apps.filter(a => ['approved', 'completed'].includes(a.status)).length;
      
      return {
        total,
        submitted,
        inProgress,
        completed
      };
    };

    // For pension, query employees table
    let employeesQuery = supabase
      .from('employees')
      .select('tmt_pensiun, unit');

    if (!isAdminPusat && userUnit) {
      employeesQuery = employeesQuery.eq('unit', userUnit);
    }

    const { data: employees } = await employeesQuery;

    const now = new Date();
    const oneYear = new Date();
    oneYear.setFullYear(now.getFullYear() + 1);

    const pensiunSoon = employees?.filter(e => {
      if (!e.tmt_pensiun) return false;
      const pensiunDate = new Date(e.tmt_pensiun);
      return pensiunDate >= now && pensiunDate <= oneYear;
    }) || [];

    // Query consultation tickets for konsultasi stats
    let consultationQuery = supabase
      .from('consultation_tickets')
      .select('status');

    if (!isAdminPusat && userUnit) {
      consultationQuery = consultationQuery.eq('user_unit', userUnit);
    }

    const { data: tickets } = isAdminPusat ? await consultationQuery : { data: null };

    return {
      mutasi: {
        ...countByStatus(mutasiApps)
      },
      pangkat: {
        ...countByStatus(pangkatApps)
      },
      pensiun: {
        ...countByStatus(pensiunApps),
        reminder: pensiunSoon.length,
        total: employees?.length || 0
      },
      konsultasi: isAdminPusat && tickets ? {
        total: tickets.length,
        active: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        pending: tickets.filter(t => t.status === 'open').length,
      } : null,
    };
    },
    enabled: !!user,
  });

  const getIconComponent = (appId: string) => {
    const icons: Record<string, any> = {
      mutasi: FileText,
      pangkat: TrendingUp,
      pensiun: Calendar,
      konsultasi: MessageSquare,
    };
    return icons[appId] || FileText;
  };

  const getColorClass = (appId: string) => {
    const colors: Record<string, string> = {
      mutasi: 'blue',
      pangkat: 'green',
      pensiun: 'orange',
      konsultasi: 'purple',
    };
    return colors[appId] || 'blue';
  };

  const getFeatures = (appId: string) => {
    const features: Record<string, string[]> = {
      mutasi: ['Form pengajuan online', 'Upload dokumen Google Drive', 'Tracking status real-time', 'Notifikasi otomatis'],
      pangkat: ['Validasi syarat otomatis', 'Checklist dokumen', 'Kalkulasi masa kerja', 'Integrasi database kepangkatan'],
      pensiun: ['Auto-reminder pensiun', 'Dashboard countdown', 'Checklist persiapan', 'Generate surat keterangan'],
      konsultasi: ['Ticketing system', 'Live chat konselor', 'Knowledge base FAQ', 'Rating & feedback'],
    };
    return features[appId] || [];
  };

  const getAppStats = (appId: string) => {
    if (!stats) return null;
    if (!canViewStats(user, appId)) return null;

    const statsMap: Record<string, any> = {
      mutasi: stats.mutasi,
      pangkat: stats.pangkat,
      pensiun: stats.pensiun,
      konsultasi: stats.konsultasi,
    };
    return statsMap[appId];
  };

  const handleOpenApp = (app: any) => {
    navigate(app.route);
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
              Akses aplikasi administrasi ASN yang tersedia untuk {user?.role === 'admin_pusat' ? 'Admin Pusat' : `Admin Unit - ${user?.unit}`}
            </p>
          </div>
          <div className="text-right">
            <Badge className="bg-brand-100 text-brand-700 border-brand-200">
              {accessibleApps.length} Aplikasi Tersedia
            </Badge>
            {user?.role === 'admin_unit' && user?.unit && (
              <p className="text-sm text-gray-500 mt-2">Unit: {user.unit}</p>
            )}
          </div>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {accessibleApps.map((app) => {
          const Icon = getIconComponent(app.id);
          const color = getColorClass(app.id);
          const features = getFeatures(app.id);
          const appStats = getAppStats(app.id);

          return (
            <Card key={app.id} className="hover:shadow-lg transition-all duration-200 border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-${color}-100`}>
                      <Icon className={`w-6 h-6 text-${color}-600`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{app.title}</CardTitle>
                      <CardDescription className="mt-2 text-sm">
                        {app.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    Aktif
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Features */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">Fitur Utama:</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats - only show if user has permission */}
                {appStats && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">
                      Statistik {user?.role === 'admin_unit' ? `(${user.unit})` : ''}:
                    </h4>
                    <div className="flex gap-4 text-xs">
                      {Object.entries(appStats).filter(([key]) => key !== 'total').map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="font-bold text-gray-900">{value as number}</p>
                          <p className="text-gray-600 capitalize">
                            {key === 'submitted' ? 'Diajukan' : 
                             key === 'inProgress' ? 'Diproses' : 
                             key === 'completed' ? 'Selesai' :
                             key === 'reminder' ? 'Reminder' : 
                             key === 'active' ? 'Aktif' :
                             key === 'resolved' ? 'Selesai' :
                             key === 'pending' ? 'Pending' : key}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    className="btn-primary flex-1" 
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
          );
        })}
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
