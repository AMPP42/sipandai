import { useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle, UserCheck, Users, BarChart3, MessageSquare, HelpCircle } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { getAccessibleAdminTabs, canAccessAdminTab } from '@/lib/permissions';

// Import existing admin components
import AdminPegawai from "./AdminPegawai";
import AdminFormasi from "./AdminFormasi";
import AdminUsers from "./AdminUsers";
import AdminReports from "./AdminReports";
import Verifikasi from "./Verifikasi";
import AdminConsultations from "./AdminConsultations";
import AdminFAQ from "./AdminFAQ";

export default function PanelAdmin() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  // Get tabs accessible to current user based on permissions
  const accessibleTabs = getAccessibleAdminTabs(user);
  const defaultTab = accessibleTabs[0]?.id || 'database-pegawai';
  const [activeTab, setActiveTab] = useState(tabFromUrl || defaultTab);

  useEffect(() => {
    if (tabFromUrl) {
      // Check if user has permission to access this tab
      if (canAccessAdminTab(user, tabFromUrl)) {
        setActiveTab(tabFromUrl);
      } else {
        // Redirect to first accessible tab
        setActiveTab(defaultTab);
      }
    }
  }, [tabFromUrl, user, defaultTab]);

  // Redirect non-admin users
  if (!user || (user.role !== 'admin_pusat' && user.role !== 'admin_unit')) {
    return <Navigate to="/dashboard" replace />;
  }

  // Get tab icon
  const getTabIcon = (tabId: string) => {
    const icons: Record<string, any> = {
      'database-pegawai': Database,
      'formasi-jabatan': UserCheck,
      'verifikasi-usulan': CheckCircle,
      'user-management': Users,
      'statistik-laporan': BarChart3,
      'konsultasi-tiket': MessageSquare,
      'faq-management': HelpCircle,
    };
    return icons[tabId] || Database;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Panel Admin</h1>
          <p className="text-muted-foreground">
            Kelola sistem administrasi ASN secara terpusat
          </p>
        </div>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-${accessibleTabs.length}`}>
            {accessibleTabs.map((tab) => {
              const Icon = getTabIcon(tab.id);
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {tab.title}
                  {tab.id === 'database-pegawai' && user?.role === 'admin_unit' && user?.unit && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {user.unit}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="database-pegawai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Pegawai
                  {user?.role === 'admin_unit' && user?.unit && (
                    <Badge variant="secondary" className="ml-2">
                      {user.unit}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {user?.role === 'admin_unit' 
                    ? `Kelola data pegawai untuk unit ${user.unit}` 
                    : 'Kelola data pegawai ASN secara terpusat'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminPegawai />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verifikasi-usulan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Verifikasi Usulan
                  {user?.role === 'admin_unit' && user?.unit && (
                    <Badge variant="secondary" className="ml-2">
                      {user.unit}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {user?.role === 'admin_unit'
                    ? `Verifikasi usulan mutasi dari unit ${user.unit}`
                    : 'Verifikasi dan proses usulan mutasi pegawai'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Verifikasi />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="formasi-jabatan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Formasi Jabatan
                </CardTitle>
                <CardDescription>
                  Kelola formasi dan struktur jabatan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminFormasi />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-management" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Kelola pengguna dan hak akses sistem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminUsers />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistik-laporan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Statistik & Laporan
                </CardTitle>
                <CardDescription>
                  Lihat statistik dan buat laporan sistem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminReports />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="konsultasi-tiket" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Tiket Konsultasi
                </CardTitle>
                <CardDescription>
                  Kelola tiket konsultasi dari pengguna
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminConsultations />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq-management" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Kelola FAQ
                </CardTitle>
                <CardDescription>
                  Kelola pertanyaan yang sering ditanyakan (FAQ)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminFAQ />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}