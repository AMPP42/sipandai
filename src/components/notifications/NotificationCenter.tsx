
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  body?: string;
  notification_type?: 'info' | 'success' | 'warning' | 'error' | 'chat' | 'application' | 'appointment';
  priority?: string;
  action_url?: string;
  action_label?: string;
  read_at?: string;
  created_at: string;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Subscribe to real-time notifications
      const subscription = supabase
        .channel(`notifications_${user.id}`)
        .on('postgres_changes', 
          { 
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public', 
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`
          }, 
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newNotification: Notification = {
                id: (payload.new as any).id,
                title: (payload.new as any).title,
                body: (payload.new as any).body,
                notification_type: (payload.new as any).notification_type || 'info',
                priority: (payload.new as any).priority,
                action_url: (payload.new as any).action_url,
                action_label: (payload.new as any).action_label,
                read_at: (payload.new as any).read_at,
                created_at: (payload.new as any).created_at
              };
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
            } else if (payload.eventType === 'UPDATE') {
              // Handle updates to existing notifications (e.g., marking as read)
              setNotifications(prev => 
                prev.map(n => 
                  n.id === (payload.old as any).id 
                    ? { ...n, ...(payload.new as any) }
                    : n
                )
              );
            }
          }
        )
        .subscribe((status, err) => {
          if (err) console.error('Subscription error:', err);
          console.log('Notification subscription status:', status);
        });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, notification_type, priority, action_url, action_label, read_at, created_at')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const notificationsWithType: Notification[] = (data || []).map(notification => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        notification_type: notification.notification_type as any || 'info',
        priority: notification.priority,
        action_url: notification.action_url,
        action_label: notification.action_label,
        read_at: notification.read_at,
        created_at: notification.created_at
      }));

      setNotifications(notificationsWithType);
      setUnreadCount(notificationsWithType.filter(n => !n.read_at).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification?.read_at) return; // Already read

      const { error } = await supabase
        .from('notifications')
        .update({ 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state optimistically
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .is('read_at', null);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string = 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'chat':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'application':
        return <CheckCircle className="w-5 h-5 text-purple-600" />;
      case 'appointment':
        return <CheckCircle className="w-5 h-5 text-teal-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifikasi
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <Check className="w-4 h-4 mr-1" />
            Tandai Semua
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Tidak ada notifikasi
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-100 ${
                  !notification.read_at ? 'bg-blue-50' : ''
                } ${notification.priority === 'urgent' ? 'border-l-4 border-l-red-500' : ''} hover:bg-gray-50 transition-colors`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.notification_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                          {notification.priority === 'urgent' && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Urgent
                            </Badge>
                          )}
                          {notification.priority === 'high' && (
                            <Badge variant="default" className="ml-2 text-xs">
                              High
                            </Badge>
                          )}
                        </h4>
                      </div>
                      {!notification.read_at && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="ml-2 h-6 w-6 p-0"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    {notification.body && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                    {notification.action_url && notification.action_label && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 mt-2 text-xs"
                        onClick={() => {
                          window.location.href = notification.action_url!;
                          markAsRead(notification.id);
                        }}
                      >
                        {notification.action_label} →
                      </Button>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: id
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
