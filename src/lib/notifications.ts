import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'chat' | 'application' | 'appointment';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

interface CreateNotificationParams {
  recipientId: string;
  title: string;
  body?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
}

export async function createNotification({
  recipientId,
  title,
  body,
  type = 'info',
  priority = 'normal',
  actionUrl,
  actionLabel,
}: CreateNotificationParams) {
  try {
    const { data, error } = await supabase.rpc('create_notification', {
      p_recipient_id: recipientId,
      p_title: title,
      p_body: body || null,
      p_type: type,
      p_priority: priority,
      p_action_url: actionUrl || null,
      p_action_label: actionLabel || null,
    });

    if (error) throw error;
    return { success: true, notificationId: data };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

export async function createApplicationStatusNotification(
  recipientId: string,
  applicationTitle: string,
  oldStatus: string,
  newStatus: string,
  adminNotes?: string
) {
  const statusMessages: Record<string, { title: string; body: string; priority: NotificationPriority }> = {
    approved: {
      title: 'Pengajuan Disetujui',
      body: `${applicationTitle} telah disetujui`,
      priority: 'high',
    },
    rejected: {
      title: 'Pengajuan Ditolak',
      body: `${applicationTitle} ditolak. ${adminNotes || ''}`,
      priority: 'high',
    },
    revision_needed: {
      title: 'Perbaikan Diperlukan',
      body: `${applicationTitle} perlu diperbaiki. ${adminNotes || ''}`,
      priority: 'high',
    },
    submitted: {
      title: oldStatus === 'revision_needed' ? 'Perbaikan Diterima' : 'Pengajuan Diterima',
      body: `${applicationTitle} telah diterima dan menunggu verifikasi`,
      priority: 'normal',
    },
  };

  const config = statusMessages[newStatus] || {
    title: 'Update Status Pengajuan',
    body: `Status "${applicationTitle}" diperbarui`,
    priority: 'normal' as NotificationPriority,
  };

  return createNotification({
    recipientId,
    title: config.title,
    body: config.body,
    type: 'application',
    priority: config.priority,
    actionUrl: '/status',
    actionLabel: 'Lihat Detail',
  });
}
