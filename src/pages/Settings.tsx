
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileSettings from '@/components/auth/ProfileSettings';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, Calendar, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Settings() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-600 mt-1">Kelola profil dan preferensi akun Anda</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifikasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informasi Akun
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600">Roles:</span>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map(role => (
                        <Badge 
                          key={role}
                          className={
                            role === 'admin_pusat' ? 'bg-purple-100 text-purple-700' : 
                            role === 'admin_unit' ? 'bg-blue-100 text-blue-700' : 
                            'bg-gray-100 text-gray-700'
                          }
                        >
                          {role === 'admin_pusat' ? 'Admin Pusat' : 
                           role === 'admin_unit' ? 'Admin Unit' : 'User Unit'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {user.work_unit_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Unit ID:</span>
                      <span className="text-sm font-medium text-gray-900">{user.work_unit_id}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bergabung:</span>
                    <span className="text-sm text-gray-900">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Settings */}
            <div className="lg:col-span-2">
              <ProfileSettings />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}
