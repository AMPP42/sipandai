import { useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle, UserCheck, Users, BarChart3, MessageSquare } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

// Import existing admin components
import AdminPegawai from "./AdminPegawai";
import AdminFormasi from "./AdminFormasi";
import AdminUsers from "./AdminUsers";
import AdminReports from "./AdminReports";
import Verifikasi from "./Verifikasi";

export default function PanelAdmin() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "database-pegawai");

  useEffect(() => {
    if (tabFromUrl) {
      // For admin_unit, redirect to database-pegawai if trying to access other tabs
      if (user?.role === 'admin_unit' && tabFromUrl !== 'database-pegawai') {
        setActiveTab('database-pegawai');
      } else {
        setActiveTab(tabFromUrl);
      }
    }
  }, [tabFromUrl, user?.role]);

  // Redirect admin_unit users if they don't have access to panel admin
  if (user?.role === 'admin_unit') {
    // Only allow access to database-pegawai tab
    if (tabFromUrl && tabFromUrl !== 'database-pegawai') {
      return <Navigate to="/panel-admin?tab=database-pegawai" replace />;
    }
  }

  // Redirect non-admin users
  if (user?.role !== 'admin_pusat' && user?.role !== 'admin_unit') {
    return <Navigate to="/dashboard" replace />;
  }

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
          <TabsList className={`grid w-full ${user?.role === 'admin_unit' ? 'grid-cols-1' : 'grid-cols-5'}`}>
            <TabsTrigger value="database-pegawai" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Database Pegawai
              {user?.role === 'admin_unit' && user?.unit && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {user.unit}
                </Badge>
              )}
            </TabsTrigger>
            {user?.role === 'admin_pusat' && (
              <>
                <TabsTrigger value="verifikasi-usulan" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Verifikasi Usulan
                </TabsTrigger>
                <TabsTrigger value="formasi-jabatan" className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Formasi Jabatan
                </TabsTrigger>
                <TabsTrigger value="user-management" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  User Management
                </TabsTrigger>
                <TabsTrigger value="statistik-laporan" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Statistik & Laporan
                </TabsTrigger>
              </>
            )}
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

          {user?.role === 'admin_pusat' && (
            <>
              <TabsContent value="verifikasi-usulan" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Verifikasi Usulan
                    </CardTitle>
                    <CardDescription>
                      Verifikasi dan proses usulan mutasi pegawai
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
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}