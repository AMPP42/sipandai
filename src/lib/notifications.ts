// Temporary stub - notifications will be reimplemented with new database structure

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

export async function createNotification(_params: CreateNotificationParams) {
  console.log('Notification system will be reimplemented');
  return { success: true, notificationId: null };
}

export async function notifyAdminUnitOnApplicationUpdate(
  _applicationId: string,
  _applicantUnit: string,
  _applicationTitle: string,
  _newStatus: string,
  _adminName: string,
  _notes?: string
) {
  console.log('Notification system will be reimplemented');
}

export async function notifyAdminPusatOnSubmission(
  _applicationTitle: string,
  _applicantName: string,
  _applicantUnit: string,
  _isResubmission: boolean
) {
  console.log('Notification system will be reimplemented');
}

export async function notifyUserOnAppointmentUpdate(
  _userId: string,
  _appointmentDetails: string,
  _newStatus: string,
  _adminNotes?: string
) {
  console.log('Notification system will be reimplemented');
  return { success: true };
}

export async function notifyUserOnConsultationUpdate(
  _userId: string,
  _ticketNumber: string,
  _newStatus: string,
  _konselorName?: string
) {
  console.log('Notification system will be reimplemented');
  return { success: true };
}

export async function createApplicationStatusNotification(
  _recipientId: string,
  _applicationTitle: string,
  _oldStatus: string,
  _newStatus: string,
  _adminNotes?: string
) {
  console.log('Notification system will be reimplemented');
  return { success: true };
}
