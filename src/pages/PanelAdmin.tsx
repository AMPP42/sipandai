import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Building2, Users, UserCog } from 'lucide-react';
import AdminUnits from '@/components/admin/AdminUnits';
import UserRegistrationRequests from '@/components/admin/UserRegistrationRequests';
import UnitUserManagement from '@/components/admin/UnitUserManagement';

export default function PanelAdmin() {
  const { user, isAdminPusat, isAdminUnit, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdminPusat && !isAdminUnit) {
    return (
      <div className="container mx-auto p-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Anda tidak memiliki akses ke Panel Admin. Halaman ini hanya untuk Admin Pusat dan Admin Unit.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Panel Admin</h1>
          <p className="text-muted-foreground">
            Kelola sistem, user, dan konfigurasi
          </p>
        </div>
      </div>

      <Tabs defaultValue={isAdminPusat ? "units" : "requests"} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          {isAdminPusat && (
            <TabsTrigger value="units" className="gap-2">
              <Building2 className="w-4 h-4" />
              Unit Kerja
            </TabsTrigger>
          )}
          <TabsTrigger value="requests" className="gap-2">
            <Users className="w-4 h-4" />
            Permintaan Registrasi
          </TabsTrigger>
          {isAdminPusat && (
            <TabsTrigger value="management" className="gap-2">
              <UserCog className="w-4 h-4" />
              Kelola User Unit
            </TabsTrigger>
          )}
        </TabsList>

        {isAdminPusat && (
          <TabsContent value="units">
            <AdminUnits />
          </TabsContent>
        )}

        <TabsContent value="requests">
          <UserRegistrationRequests />
        </TabsContent>

        {isAdminPusat && (
          <TabsContent value="management">
            <UnitUserManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
