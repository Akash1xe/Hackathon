// File: c:\hackathon\src\lib\createNotification.js
import dbConnect from '@/lib/dbConnect';
import Notification from '@/model/Notification';
import User from '@/model/User';

/**
 * Creates a notification for a user
 * @param {Object} notificationData - The notification data
 * @param {string} notificationData.recipient - User ID to receive notification
 * @param {string} notificationData.type - Type of notification
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} [notificationData.relatedReport] - Optional related report ID
 * @param {string} [notificationData.relatedDepartment] - Optional related department ID
 * @returns {Promise<Object>} The created notification
 */
export async function createNotification(notificationData) {
  try {
    await dbConnect();
    
    // Validate required fields
    const { recipient, type, title, message } = notificationData;
    
    if (!recipient || !type || !title || !message) {
      throw new Error('Missing required notification fields');
    }
    
    // Create the notification
    const notification = new Notification(notificationData);
    await notification.save();
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Creates notifications for all users in a department
 * @param {Object} notificationData - Base notification data
 * @param {string} departmentId - ID of the department
 * @returns {Promise<Array>} Array of created notifications
 */
export async function notifyDepartment(notificationData, departmentId) {
  try {
    await dbConnect();
    
    // Find all users in the department
    const users = await User.find({ 
      $or: [
        { department: departmentId },
        { role: 'admin' } // Always notify admins
      ]
    });
    
    const notifications = [];
    
    // Create a notification for each user
    for (const user of users) {
      const userNotification = {
        ...notificationData,
        recipient: user._id,
        relatedDepartment: departmentId
      };
      
      const notification = await createNotification(userNotification);
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error notifying department:', error);
    throw error;
  }
}

/**
 * Notify user about report status change
 * @param {string} userId - User ID to notify
 * @param {string} reportId - ID of the report
 * @param {string} reportTitle - Title of the report
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @returns {Promise<Object>} Created notification
 */
export async function notifyReportStatusChange(userId, reportId, reportTitle, oldStatus, newStatus) {
  const title = `Report Status Updated: ${formatStatus(newStatus)}`;
  const message = `Your report "${reportTitle}" has been updated from ${formatStatus(oldStatus)} to ${formatStatus(newStatus)}.`;
  
  return createNotification({
    recipient: userId,
    type: 'report_status_change',
    title,
    message,
    relatedReport: reportId
  });
}

/**
 * Notify user about report assignment
 * @param {string} userId - User ID to notify
 * @param {string} reportId - ID of the report
 * @param {string} reportTitle - Title of the report
 * @param {string} departmentName - Name of the department
 * @returns {Promise<Object>} Created notification
 */
export async function notifyReportAssigned(userId, reportId, reportTitle, departmentId, departmentName) {
  const title = 'Report Assigned';
  const message = `Your report "${reportTitle}" has been assigned to the ${departmentName} department.`;
  
  return createNotification({
    recipient: userId,
    type: 'report_assigned',
    title,
    message,
    relatedReport: reportId,
    relatedDepartment: departmentId
  });
}

/**
 * Notify user about report resolution
 * @param {string} userId - User ID to notify
 * @param {string} reportId - ID of the report
 * @param {string} reportTitle - Title of the report
 * @returns {Promise<Object>} Created notification
 */
export async function notifyReportResolved(userId, reportId, reportTitle) {
  const title = 'Report Resolved';
  const message = `Your report "${reportTitle}" has been marked as resolved.`;
  
  return createNotification({
    recipient: userId,
    type: 'report_resolved',
    title,
    message,
    relatedReport: reportId
  });
}

/**
 * Notify admins about a new report
 * @param {string} reportId - ID of the report
 * @param {string} reportTitle - Title of the report
 * @param {string} userName - Name of the user who submitted the report
 * @returns {Promise<Array>} Array of created notifications
 */
export async function notifyAdminsNewReport(reportId, reportTitle, userName) {
  try {
    await dbConnect();
    
    // Find all admin users
    const admins = await User.find({ role: 'admin' });
    
    const notifications = [];
    
    // Create a notification for each admin
    for (const admin of admins) {
      const notification = await createNotification({
        recipient: admin._id,
        type: 'admin_alert',
        title: 'New Report Submitted',
        message: `${userName} has submitted a new report: "${reportTitle}".`,
        relatedReport: reportId
      });
      
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error notifying admins:', error);
    throw error;
  }
}

// Helper function to format status
function formatStatus(status) {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}