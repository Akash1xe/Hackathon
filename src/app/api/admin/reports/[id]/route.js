import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { isValidObjectId, parseAdminReportUpdate } from '@/lib/validation';
import { createNotification, notifyReportAssigned, notifyReportResolved, notifyReportStatusChange } from '@/lib/createNotification';
import Report from '@/model/Report';
import Department from '@/model/Department';

async function adminSession() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' ? session : null;
}

export async function GET(request, { params }) {
  try {
    if (!await adminSession()) return apiError('Administrator access required.', 403);
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError('Invalid report ID.', 400);
    await dbConnect();
    const report = await Report.findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('submittedBy', 'name email phone')
      .populate('assignedTo.department', 'name description contactEmail contactPhone');
    if (!report) return apiError('Report not found.', 404);
    return NextResponse.json(report);
  } catch (error) {
    console.error('Unable to load admin report:', error);
    return apiError('Unable to load this report.', 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await adminSession();
    if (!session) return apiError('Administrator access required.', 403);
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError('Invalid report ID.', 400);
    const parsed = parseAdminReportUpdate(await request.json());
    if (!parsed.valid) return apiError('Please correct the case update.', 400, parsed.errors);
    await dbConnect();

    const report = await Report.findOne({ _id: id, deletedAt: { $exists: false } });
    if (!report) return apiError('Report not found.', 404);
    const previousStatus = report.status;
    const previousDepartmentId = report.assignedTo?.department?.toString() || null;
    let department = null;
    let departmentChanged = false;

    if (parsed.value.departmentId) {
      department = await Department.findOne({ _id: parsed.value.departmentId, active: true });
      if (!department) return apiError('Selected department is unavailable.', 400);
      departmentChanged = previousDepartmentId !== department._id.toString();
      report.assignedTo = { department: department._id, assignedAt: new Date() };
      if (departmentChanged && (!parsed.value.status || parsed.value.status === previousStatus) && ['submitted', 'in_review'].includes(previousStatus)) parsed.value.status = 'assigned';
    } else if (parsed.value.departmentId === null) {
      departmentChanged = previousDepartmentId !== null;
      report.assignedTo = { department: undefined, assignedAt: undefined };
    }

    if (parsed.value.priority) report.priority = parsed.value.priority;
    if (parsed.value.resolutionNote !== undefined) report.resolutionNote = parsed.value.resolutionNote;
    if (parsed.value.comment) report.adminComment = parsed.value.comment;
    const statusChanged = parsed.value.status && parsed.value.status !== previousStatus;
    if (statusChanged) {
      report.status = parsed.value.status;
      report.resolvedAt = parsed.value.status === 'resolved' ? new Date() : undefined;
    }
    if (statusChanged || parsed.value.comment) {
      report.statusHistory.push({ status: report.status, timestamp: new Date(), comment: parsed.value.comment || `Status updated to ${report.status.replaceAll('_', ' ')}`, changedBy: session.user.id });
    }
    await report.save();

    const ownerId = report.submittedBy.toString();
    try {
      if (departmentChanged && department) await notifyReportAssigned(ownerId, report._id, report.title, department._id, department.name);
      else if (report.status === 'resolved' && statusChanged) await notifyReportResolved(ownerId, report._id, report.title);
      else if (statusChanged) await notifyReportStatusChange(ownerId, report._id, report.title, previousStatus, report.status);
      else if (parsed.value.comment) await createNotification({ recipient: ownerId, type: 'comment_added', title: 'New update on your report', message: parsed.value.comment, relatedReport: report._id });
    } catch (notificationError) { console.error('Case updated but notification failed:', notificationError); }

    await report.populate('submittedBy', 'name email phone');
    await report.populate('assignedTo.department', 'name');
    return NextResponse.json({ message: 'Case updated successfully.', report });
  } catch (error) {
    console.error('Unable to update admin report:', error);
    return apiError('Unable to update this case.', 500);
  }
}
