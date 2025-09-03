import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  recipientId: string;
  title: string;
  body?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: params.recipientId,
        title: params.title,
        body: params.body
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
};

export const createApplicationStatusNotification = async (
  recipientId: string,
  applicationTitle: string,
  oldStatus: string,
  newStatus: string,
  adminNotes?: string
) => {
  let title = '';
  let body = '';
  let type: 'info' | 'success' | 'warning' | 'error' = 'info';

  switch (newStatus) {
    case 'approved':
      title = 'Usulan Disetujui';
      body = `${applicationTitle} telah disetujui dan diproses lebih lanjut.`;
      type = 'success';
      break;
    case 'rejected':
      title = 'Usulan Ditolak';
      body = `${applicationTitle} telah ditolak. ${adminNotes ? `Alasan: ${adminNotes}` : ''}`;
      type = 'error';
      break;
    case 'revision_needed':
      title = 'Usulan Perlu Revisi';
      body = `${applicationTitle} perlu diperbaiki. ${adminNotes ? `Catatan: ${adminNotes}` : ''}`;
      type = 'warning';
      break;
    case 'in_review':
      title = 'Usulan Sedang Direview';
      body = `${applicationTitle} sedang dalam tahap review oleh admin pusat.`;
      type = 'info';
      break;
    case 'submitted':
      if (oldStatus === 'revision_needed') {
        title = 'Perbaikan Diterima';
        body = `Perbaikan untuk ${applicationTitle} telah diterima dan sedang menunggu verifikasi ulang.`;
        type = 'info';
      } else {
        title = 'Usulan Diterima';
        body = `${applicationTitle} telah diterima dan sedang menunggu verifikasi.`;
        type = 'info';
      }
      break;
  }

  return await createNotification({
    recipientId,
    title,
    body,
    type
  });
};

export const createSystemNotification = async (
  recipientId: string,
  title: string,
  body: string
) => {
  return await createNotification({
    recipientId,
    title,
    body,
    type: 'info'
  });
};

export const notifyPensionReminder = async (
  recipientId: string,
  employeeName: string,
  monthsRemaining: number
) => {
  let title = '';
  let body = '';
  let type: 'info' | 'warning' = 'info';

  if (monthsRemaining <= 3) {
    title = 'Reminder Pensiun Mendesak';
    body = `${employeeName} akan pensiun dalam ${monthsRemaining} bulan. Segera persiapkan administrasi pensiun.`;
    type = 'warning';
  } else if (monthsRemaining <= 6) {
    title = 'Reminder Pensiun';
    body = `${employeeName} akan pensiun dalam ${monthsRemaining} bulan. Mulai persiapkan administrasi pensiun.`;
    type = 'info';
  }

  if (title && body) {
    return await createNotification({
      recipientId,
      title,
      body,
      type
    });
  }

  return { success: true };
};