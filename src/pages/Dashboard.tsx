
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalEmployees: number;
  pendingApplications: number;
  completedApplications: number;
  activeConsultations: number;
  myApplications: number;
  pendingReview: number;
  approved: number;
  consultations: number;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  created_at: string;
  status: string;
  type: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    pendingApplications: 0,
    completedApplications: 0,
    activeConsultations: 0,
    myApplications: 0,
    pendingReview: 0,
    approved: 0,
    consultations: 0
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      if (user.role === 'admin_pusat') {
        // Load admin statistics
        const [employeesCount, applicationsData, activitiesData] = await Promise.all([
          supabase.from('employees').select('id', { count: 'exact', head: true }),
          supabase.from('applications').select('status', { count: 'exact' }),
          supabase.from('applications').select('*').order('created_at', { ascending: false }).limit(10)
        ]);

        if (employeesCount.error) throw employeesCount.error;
        if (applicationsData.error) throw applicationsData.error;
        if (activitiesData.error) throw activitiesData.error;

        const pendingApps = applicationsData.data?.filter(app => ['submitted', 'in_review'].includes(app.status)).length || 0;
        const completedApps = applicationsData.data?.filter(app => app.status === 'approved').length || 0;

        setStats(prev => ({
          ...prev,
          totalEmployees: employeesCount.count || 0,
          pendingApplications: pendingApps,
          completedApplications: completedApps,
          activeConsultations: 0 // TODO: Implement consultations
        }));

        // Transform activities
        const activities = activitiesData.data?.map(app => ({
          id: app.id,
          title: getActivityTitle(app.status, app.jenis),
          description: `${app.submitter_name} - ${app.submitter_unit}`,
          created_at: app.created_at,
          status: app.status,
          type: app.jenis
        })) || [];

        setRecentActivities(activities);
      } else {
        // Load user statistics
        const [applicationsData, activitiesData] = await Promise.all([
          supabase.from('applications').select('*').eq('submitter_id', user.id),
          supabase.from('applications').select('*').eq('submitter_id', user.id).order('created_at', { ascending: false }).limit(10)
        ]);

        if (applicationsData.error) throw applicationsData.error;
        if (activitiesData.error) throw activitiesData.error;

        const myApps = applicationsData.data?.length || 0;
        const pendingReview = applicationsData.data?.filter(app => ['submitted', 'in_review'].includes(app.status)).length || 0;
        const approved = applicationsData.data?.filter(app => app.status === 'approved').length || 0;

        setStats(prev => ({
          ...prev,
          myApplications: myApps,
          pendingReview: pendingReview,
          approved: approved,
          consultations: 0 // TODO: Implement consultations
        }));

        // Transform activities
        const activities = activitiesData.data?.map(app => ({
          id: app.id,
          title: getActivityTitle(app.status, app.jenis),
          description: app.judul || `${app.jenis} - ${app.submitter_unit}`,
          created_at: app.created_at,
          status: app.status,
          type: app.jenis
        })) || [];

        setRecentActivities(activities);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityTitle = (status: string, jenis: string) => {
    const jenisLabel = jenis === 'pensiun' ? 'Pensiun' : jenis === 'mutasi' ? 'Mutasi' : 'Kenaikan Pangkat';
    
    switch (status) {
      case 'approved': return `${jenisLabel} Disetujui`;
      case 'rejected': return `${jenisLabel} Ditolak`;
      case 'revision_needed': return `${jenisLabel} Perlu Revisi`;
      case 'in_review': return `${jenisLabel} Sedang Direview`;
      case 'submitted': return `${jenisLabel} Menunggu Verifikasi`;
      default: return `${jenisLabel} Draft`;
    }
  };

  const handleQuickAction = (href: string, tab?: string) => {
    if (tab && href === '/panel-admin') {
      navigate(`${href}?tab=${tab}`);
    } else {
      navigate(href);
    }
  };

  const statsCards = user?.role === 'admin_pusat' 
    ? [
        { 
          title: 'Total Pegawai', 
          value: loading ? '...' : stats.totalEmployees.toLocaleString('id-ID'), 
          icon: Users, 
          color: 'blue', 
          trend: `${stats.totalEmployees} pegawai terdaftar`,
          onClick: () => navigate('/panel-admin')
        },
        { 
          title: 'Usulan Pending', 
          value: loading ? '...' : stats.pendingApplications.toString(), 
          icon: Clock, 
          color: 'yellow', 
          trend: 'Menunggu verifikasi',
          onClick: () => navigate('/panel-admin')
        },
        { 
          title: 'Usulan Selesai', 
          value: loading ? '...' : stats.completedApplications.toString(), 
          icon: CheckCircle, 
          color: 'green', 
          trend: 'Telah disetujui',
          onClick: () => navigate('/panel-admin')
        },
        { 
          title: 'Konsultasi Aktif', 
          value: loading ? '...' : stats.activeConsultations.toString(), 
          icon: MessageSquare, 
          color: 'purple', 
          trend: 'Konsultasi berjalan',
          onClick: () => navigate('/apps/konsultasi-sdm')
        }
      ]
    : [
        { 
          title: 'Usulan Saya', 
          value: loading ? '...' : stats.myApplications.toString(), 
          icon: FileText, 
          color: 'blue', 
          trend: 'Total pengajuan',
          onClick: () => navigate('/status-usulan')
        },
        { 
          title: 'Menunggu Review', 
          value: loading ? '...' : stats.pendingReview.toString(), 
          icon: Clock, 
          color: 'yellow', 
          trend: 'Sedang diproses',
          onClick: () => navigate('/status-usulan')
        },
        { 
          title: 'Telah Disetujui', 
          value: loading ? '...' : stats.approved.toString(), 
          icon: CheckCircle, 
          color: 'green', 
          trend: 'Usulan disetujui',
          onClick: () => navigate('/status-usulan')
        },
        { 
          title: 'Konsultasi', 
          value: loading ? '...' : stats.consultations.toString(), 
          icon: MessageSquare, 
          color: 'purple', 
          trend: 'Konsultasi SDM',
          onClick: () => navigate('/apps/konsultasi-sdm')
        }
      ];

  const quickActions = user?.role === 'admin_pusat'
    ? [
        { title: 'Verifikasi Usulan', desc: 'Review dan verifikasi usulan yang masuk', href: '/panel-admin', tab: 'verifikasi-usulan', icon: CheckCircle, badge: stats.pendingApplications > 0 ? `${stats.pendingApplications} baru` : undefined },
        { title: 'Database Pegawai', desc: 'Kelola data master pegawai', href: '/panel-admin', tab: 'database-pegawai', icon: Users },
        { title: 'Laporan Statistik', desc: 'Lihat laporan dan analisis data', href: '/panel-admin', tab: 'statistik-laporan', icon: BarChart3 },
        { title: 'User Management', desc: 'Kelola akun pengguna sistem', href: '/panel-admin', tab: 'user-management', icon: Users }
      ]
    : [
        { title: 'Pengajuan Mutasi', desc: 'Ajukan usulan mutasi pegawai', href: '/apps/pengajuan-mutasi', icon: FileText },
        { title: 'Kenaikan Pangkat', desc: 'Ajukan usulan kenaikan pangkat', href: '/apps/kenaikan-pangkat', icon: TrendingUp },
        { title: 'Konsultasi SDM', desc: 'Konsultasi masalah kepegawaian', href: '/apps/konsultasi-sdm', icon: MessageSquare },
        { title: 'Administrasi Pensiun', desc: 'Kelola administrasi pensiun', href: '/apps/reminder-pensiun', icon: Calendar }
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
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card 
            key={index} 
            className="hover:shadow-md transition-shadow cursor-pointer" 
            onClick={stat.onClick}
          >
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
        <Card className="lg:col-span-1">
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
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer" onClick={() => handleQuickAction(action.href, action.tab)}>
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
                      <p className="text-xs text-gray-600">{action.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <div className="lg:col-span-1">
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
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Belum ada aktivitas terbaru
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      activity.status === 'approved' ? 'bg-green-500' :
                      activity.status === 'rejected' ? 'bg-red-500' :
                      activity.status === 'revision_needed' ? 'bg-orange-500' :
                      activity.status === 'in_review' ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{activity.description}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(activity.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button 
              variant="outline" 
              className="w-full mt-4 text-sm"
              onClick={() => user?.role === 'admin_pusat' ? navigate('/panel-admin') : navigate('/status-usulan')}
            >
              Lihat Semua Aktivitas
            </Button>
          </CardContent>
        </Card>
        </div>
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
