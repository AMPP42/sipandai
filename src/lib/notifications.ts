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

// Helper function to notify admin unit when admin pusat makes a decision
export async function notifyAdminUnitOnApplicationUpdate(
  applicationId: string,
  applicantUnit: string,
  applicationTitle: string,
  newStatus: string,
  adminName: string,
  notes?: string
) {
  try {
    // Get all admin_unit users in the same unit
    const { data: unitAdmins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin_unit')
      .eq('unit', applicantUnit);

    if (!unitAdmins || unitAdmins.length === 0) return;

    const notificationTitle = newStatus === 'approved' 
      ? `✓ Usulan Disetujui: ${applicationTitle}`
      : newStatus === 'rejected'
      ? `✗ Usulan Ditolak: ${applicationTitle}`
      : newStatus === 'revision_needed'
      ? `⚠ Usulan Perlu Perbaikan: ${applicationTitle}`
      : `Update Status: ${applicationTitle}`;

    const notificationBody = `Admin Pusat (${adminName}) telah mengubah status usulan menjadi: ${newStatus}${notes ? `. Catatan: ${notes}` : ''}`;

    await Promise.all(
      unitAdmins.map(admin =>
        createNotification({
          recipientId: admin.user_id,
          title: notificationTitle,
          body: notificationBody,
          type: 'application',
          priority: newStatus === 'rejected' || newStatus === 'approved' ? 'high' : 'normal',
          actionUrl: '/panel-admin',
          actionLabel: 'Lihat di Panel Admin',
        })
      )
    );
  } catch (error) {
    console.error('Error notifying unit admins:', error);
  }
}

// Helper function to notify admin pusat when user submits/resubmits application
export async function notifyAdminPusatOnSubmission(
  applicationTitle: string,
  applicantName: string,
  applicantUnit: string,
  isResubmission: boolean
) {
  try {
    // Get all admin_pusat users
    const { data: adminPusatUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin_pusat');

    if (!adminPusatUsers || adminPusatUsers.length === 0) return;

    const title = isResubmission
      ? `🔄 Perbaikan Usulan: ${applicationTitle}`
      : `📝 Usulan Baru: ${applicationTitle}`;

    const body = isResubmission
      ? `${applicantName} (${applicantUnit}) telah mengirimkan perbaikan usulan dan menunggu verifikasi ulang.`
      : `${applicantName} (${applicantUnit}) telah mengirimkan usulan baru untuk diverifikasi.`;

    await Promise.all(
      adminPusatUsers.map(admin =>
        createNotification({
          recipientId: admin.user_id,
          title,
          body,
          type: 'application',
          priority: isResubmission ? 'high' : 'normal',
          actionUrl: '/verifikasi',
          actionLabel: 'Verifikasi Sekarang',
        })
      )
    );
  } catch (error) {
    console.error('Error notifying admin pusat:', error);
  }
}

// Helper function to notify user when their appointment status changes
export async function notifyUserOnAppointmentUpdate(
  userId: string,
  appointmentDetails: string,
  newStatus: string,
  adminNotes?: string
) {
  const statusMessages: Record<string, { title: string; body: string; priority: NotificationPriority }> = {
    approved: {
      title: '✓ Jadwal Konsultasi Disetujui',
      body: `Jadwal konsultasi Anda (${appointmentDetails}) telah disetujui.`,
      priority: 'high',
    },
    rejected: {
      title: '✗ Jadwal Konsultasi Ditolak',
      body: `Jadwal konsultasi Anda (${appointmentDetails}) ditolak. ${adminNotes || ''}`,
      priority: 'high',
    },
    rescheduled: {
      title: '📅 Jadwal Konsultasi Diubah',
      body: `Jadwal konsultasi Anda telah diubah. ${adminNotes || ''}`,
      priority: 'high',
    },
  };

  const config = statusMessages[newStatus] || {
    title: 'Update Jadwal Konsultasi',
    body: `Status jadwal konsultasi Anda: ${newStatus}`,
    priority: 'normal' as NotificationPriority,
  };

  return createNotification({
    recipientId: userId,
    title: config.title,
    body: config.body,
    type: 'appointment',
    priority: config.priority,
    actionUrl: '/apps/jadwal-konsultasi',
    actionLabel: 'Lihat Jadwal',
  });
}

// Helper function to notify user on consultation ticket updates
export async function notifyUserOnConsultationUpdate(
  userId: string,
  ticketNumber: string,
  newStatus: string,
  konselorName?: string
) {
  const statusMessages: Record<string, { title: string; body: string }> = {
    in_progress: {
      title: '💬 Sesi Konsultasi Dimulai',
      body: `Konselor ${konselorName || 'admin'} telah membuka sesi konsultasi untuk tiket ${ticketNumber}. Silakan bergabung di live chat.`,
    },
    resolved: {
      title: '✓ Konsultasi Selesai',
      body: `Sesi konsultasi tiket ${ticketNumber} telah selesai. Mohon berikan rating dan feedback.`,
    },
    closed: {
      title: 'Tiket Ditutup',
      body: `Tiket konsultasi ${ticketNumber} telah ditutup.`,
    },
  };

  const config = statusMessages[newStatus] || {
    title: 'Update Tiket Konsultasi',
    body: `Status tiket ${ticketNumber}: ${newStatus}`,
  };

  return createNotification({
    recipientId: userId,
    title: config.title,
    body: config.body,
    type: 'chat',
    priority: newStatus === 'in_progress' ? 'high' : 'normal',
    actionUrl: '/apps/konsultasi-sdm',
    actionLabel: newStatus === 'in_progress' ? 'Buka Chat' : 'Lihat Tiket',
  });
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
      title: '✓ Pengajuan Disetujui',
      body: `${applicationTitle} telah disetujui dan sedang diproses`,
      priority: 'high',
    },
    rejected: {
      title: '✗ Pengajuan Ditolak',
      body: `${applicationTitle} ditolak. ${adminNotes || 'Silakan hubungi admin untuk informasi lebih lanjut.'}`,
      priority: 'high',
    },
    revision_needed: {
      title: '⚠ Perbaikan Diperlukan',
      body: `${applicationTitle} perlu diperbaiki. ${adminNotes || 'Silakan periksa catatan admin.'}`,
      priority: 'high',
    },
    submitted: {
      title: oldStatus === 'revision_needed' ? '🔄 Perbaikan Diterima' : '📝 Pengajuan Diterima',
      body: `${applicationTitle} telah diterima dan menunggu verifikasi`,
      priority: 'normal',
    },
  };

  const config = statusMessages[newStatus] || {
    title: 'Update Status Pengajuan',
    body: `Status "${applicationTitle}" diperbarui menjadi: ${newStatus}`,
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
