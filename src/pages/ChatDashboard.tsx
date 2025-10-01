import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ChatQueue from '@/components/chat/ChatQueue';
import { LiveChatInterface } from '@/components/chat/LiveChatInterface';
import { MessageSquare, BarChart3, Users } from 'lucide-react';

export default function ChatDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('queue');

  // Only admin_pusat can access chat dashboard
  if (user?.role !== 'admin_pusat') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard Live Chat</h1>
        <p className="text-muted-foreground mt-2">
          Kelola konsultasi dan antrian chat secara real-time
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Antrian
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat Aktif
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistik
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <ChatQueue />
        </TabsContent>

        <TabsContent value="active">
          <LiveChatInterface />
        </TabsContent>

        <TabsContent value="stats">
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Statistik Chat</p>
            <p className="text-sm mt-2">Fitur statistik segera hadir</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
