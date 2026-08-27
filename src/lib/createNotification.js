import dbConnect from '@/lib/dbConnect';
import Notification from '@/model/Notification';
import User from '@/model/User';
import { statusLabel } from '@/lib/constants';

export async function createNotification(notificationData) {
  await dbConnect();
  const { recipient, type, title, message } = notificationData;
  if (!recipient || !type || !title || !message) throw new Error('Notification data is incomplete.');
  return Notification.create(notificationData);
}

export function notifyReportStatusChange(userId, reportId, reportTitle, oldStatus, newStatus) {
  return createNotification({
    recipient: userId,
    type: 'report_status_change',
    title: `Report moved to ${statusLabel(newStatus)}`,
    message: `“${reportTitle}” changed from ${statusLabel(oldStatus)} to ${statusLabel(newStatus)}.`,
    relatedReport: reportId
  });
}

export function notifyReportAssigned(userId, reportId, reportTitle, departmentId, departmentName) {
  return createNotification({
    recipient: userId,
    type: 'report_assigned',
    title: 'Report assigned to a department',
    message: `“${reportTitle}” is now assigned to ${departmentName}.`,
    relatedReport: reportId,
    relatedDepartment: departmentId
  });
}

export function notifyReportResolved(userId, reportId, reportTitle) {
  return createNotification({
    recipient: userId,
    type: 'report_resolved',
    title: 'Your report has been resolved',
    message: `The city marked “${reportTitle}” as resolved. Open the case to review the outcome.`,
    relatedReport: reportId
  });
}

export async function notifyAdminsNewReport(reportId, reportTitle, userName) {
  await dbConnect();
  const admins = await User.find({ role: 'admin', active: { $ne: false } }).select('_id').lean();
  if (!admins.length) return [];
  return Notification.insertMany(admins.map((admin) => ({
    recipient: admin._id,
    type: 'admin_alert',
    title: 'New civic report submitted',
    message: `${userName} submitted “${reportTitle}”.`,
    relatedReport: reportId
  })));
}
