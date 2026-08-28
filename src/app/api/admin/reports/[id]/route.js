import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { isValidObjectId, parseAdminReportUpdate } from '@/lib/validation';
import { createNotification, notifyReportAssigned, notifyReportResolved, notifyReportStatusChange } from '@/lib/createNotification';
import Report from '@/model/Report';
import Department from '@/model/Department';
import User from '@/model/User';
import { buildSla, calculateTrust, reputationTier } from '@/lib/civicIntelligence';

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
      .populate('assignedTo.department', 'name description contactEmail contactPhone')
      .populate('routing.suggestedDepartment', 'name')
      .populate('asset', 'assetCode name type location status');
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
    let historyAddedByAppeal = false;
    let reputationDelta = 0;

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
    if (parsed.value.priority) {
      report.risk ??= {};
      report.risk.overriddenByAdmin = true;
      report.sla = buildSla(parsed.value.priority, report.assignedTo?.assignedAt || new Date());
    }
    if (parsed.value.resolutionNote !== undefined) report.resolutionNote = parsed.value.resolutionNote;
    if (parsed.value.resolutionImages !== undefined) {
      const improvement = parsed.value.resolutionImprovementScore ?? (parsed.value.resolutionImages.length
        ? Math.min(96, Math.max(55, Math.round(100 - Number(report.evidenceAnalysis?.severity || 45) * .18)))
        : 0);
      report.resolutionEvidence = {
        images: parsed.value.resolutionImages,
        aiImprovementScore: improvement,
        beforeProblemScore: parsed.value.resolutionBeforeProblemScore,
        afterRepairScore: parsed.value.resolutionAfterRepairScore,
        assessment: parsed.value.resolutionAssessment || (improvement >= 75 ? 'likely_resolved' : improvement >= 45 ? 'needs_review' : 'unlikely_resolved'),
        model: parsed.value.resolutionModel || 'Advisory evidence heuristic',
        analyzedAt: new Date()
      };
    }
    if (parsed.value.comment) report.adminComment = parsed.value.comment;
    let statusChanged = parsed.value.status && parsed.value.status !== previousStatus;
    if (parsed.value.status === 'resolved' && !(parsed.value.resolutionImages?.length || report.resolutionEvidence?.images?.length)) {
      return apiError('Upload at least one after-repair image before resolving the case.', 400);
    }
    if (statusChanged) {
      report.status = parsed.value.status;
      report.resolvedAt = parsed.value.status === 'resolved' ? new Date() : undefined;
    }
    if (parsed.value.appealId && parsed.value.appealStatus) {
      const appeal = report.appeals.id(parsed.value.appealId);
      if (!appeal || appeal.status !== 'pending') return apiError('This appeal is no longer awaiting review.', 409);
      appeal.status = parsed.value.appealStatus;
      appeal.response = parsed.value.appealResponse;
      appeal.reviewedBy = session.user.id;
      appeal.reviewedAt = new Date();
      if (parsed.value.appealStatus === 'approved') {
        report.status = 'reopened';
        statusChanged = report.status !== previousStatus;
        report.resolvedAt = undefined;
        report.statusHistory.push({ status: 'reopened', timestamp: new Date(), comment: parsed.value.appealResponse || 'Citizen appeal approved; case reopened.', changedBy: session.user.id });
        historyAddedByAppeal = true;
      }
    }
    report.trust = calculateTrust(report);
    if (['assigned', 'in_progress', 'resolved'].includes(report.status) && !report.reputationAwards?.validReportAt && !report.reputationAwards?.invalidReportAt) {
      report.reputationAwards ??= {};
      report.reputationAwards.validReportAt = new Date();
      reputationDelta = 10;
    } else if (report.status === 'rejected' && !report.reputationAwards?.validReportAt && !report.reputationAwards?.invalidReportAt) {
      report.reputationAwards ??= {};
      report.reputationAwards.invalidReportAt = new Date();
      reputationDelta = -10;
    }
    if ((statusChanged || parsed.value.comment) && !historyAddedByAppeal) {
      report.statusHistory.push({ status: report.status, timestamp: new Date(), comment: parsed.value.comment || `Status updated to ${report.status.replaceAll('_', ' ')}`, changedBy: session.user.id });
    }
    await report.save();

    if (reputationDelta) {
      const citizen = await User.findById(report.submittedBy);
      if (citizen) {
        citizen.reputation ??= {};
        citizen.reputation.score = Math.max(0, (citizen.reputation.score || 0) + reputationDelta);
        if (reputationDelta > 0) citizen.reputation.validReports = (citizen.reputation.validReports || 0) + 1;
        else citizen.reputation.invalidReports = (citizen.reputation.invalidReports || 0) + 1;
        citizen.reputation.tier = reputationTier(citizen.reputation.score);
        await citizen.save({ validateBeforeSave: false });
      }
    }

    const ownerId = report.submittedBy.toString();
    try {
      if (departmentChanged && department) await notifyReportAssigned(ownerId, report._id, report.title, department._id, department.name);
      else if (report.status === 'resolved' && statusChanged) await notifyReportResolved(ownerId, report._id, report.title);
      else if (statusChanged) await notifyReportStatusChange(ownerId, report._id, report.title, previousStatus, report.status);
      else if (parsed.value.comment) await createNotification({ recipient: ownerId, type: 'comment_added', title: 'New update on your report', message: parsed.value.comment, relatedReport: report._id });
    } catch (notificationError) { console.error('Case updated but notification failed:', notificationError); }

    await report.populate('submittedBy', 'name email phone');
    await report.populate('assignedTo.department', 'name');
    await report.populate('routing.suggestedDepartment', 'name');
    await report.populate('asset', 'assetCode name type location status');
    return NextResponse.json({ message: 'Case updated successfully.', report });
  } catch (error) {
    console.error('Unable to update admin report:', error);
    return apiError('Unable to update this case.', 500);
  }
}
