import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { isValidObjectId, parseAdminReportUpdate } from '@/lib/validation';
import { notifyReportResolved, notifyReportStatusChange } from '@/lib/createNotification';
import Report from '@/model/Report';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return apiError('Administrator access required.', 403);
    const body = await request.json();
    const reportIds = Array.isArray(body.reportIds) ? [...new Set(body.reportIds.filter(isValidObjectId))].slice(0, 100) : [];
    if (!reportIds.length) return apiError('Select at least one valid report.', 400);
    const updateInput = {};
    if (body.updateData?.status !== undefined) updateInput.status = body.updateData.status;
    if (body.updateData?.priority !== undefined) updateInput.priority = body.updateData.priority;
    if (body.comment !== undefined) updateInput.comment = body.comment;
    const parsed = parseAdminReportUpdate(updateInput);
    if (!parsed.valid) return apiError('Please correct the batch update.', 400, parsed.errors);
    if (!parsed.value.status && !parsed.value.priority) return apiError('Choose a status or priority to update.', 400);

    await dbConnect();
    const reports = await Report.find({ _id: { $in: reportIds }, deletedAt: { $exists: false } });
    const updates = await Promise.all(reports.map(async (report) => {
      const previousStatus = report.status;
      if (parsed.value.priority) report.priority = parsed.value.priority;
      const statusChanged = parsed.value.status && parsed.value.status !== previousStatus;
      if (statusChanged) {
        report.status = parsed.value.status;
        report.statusHistory.push({ status: parsed.value.status, timestamp: new Date(), comment: parsed.value.comment || 'Batch update by administrator', changedBy: session.user.id });
        report.resolvedAt = parsed.value.status === 'resolved' ? new Date() : undefined;
      }
      await report.save();
      return { report, previousStatus, statusChanged };
    }));

    await Promise.all(updates.filter(({ statusChanged }) => statusChanged).map(async ({ report, previousStatus }) => {
      try {
        if (report.status === 'resolved') await notifyReportResolved(report.submittedBy, report._id, report.title);
        else await notifyReportStatusChange(report.submittedBy, report._id, report.title, previousStatus, report.status);
      } catch (notificationError) {
        console.error('Batch case updated but notification failed:', notificationError);
      }
    }));
    return NextResponse.json({ message: `Updated ${reports.length} reports.`, count: reports.length });
  } catch (error) {
    console.error('Batch update failed:', error);
    return apiError('Unable to update the selected reports.', 500);
  }
}
