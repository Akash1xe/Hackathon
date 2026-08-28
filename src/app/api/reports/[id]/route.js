import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { isValidObjectId, parseCitizenReport } from '@/lib/validation';
import Report from '@/model/Report';

async function resolveId(params) {
  const resolved = await params;
  return resolved?.id;
}

export async function GET(request, { params }) {
  try {
    const id = await resolveId(params);
    if (!isValidObjectId(id)) return apiError('Invalid report ID.', 400);
    await dbConnect();
    const [report, session] = await Promise.all([
      Report.findOne({ _id: id, deletedAt: { $exists: false } })
        .select('-adminComment')
        .populate('submittedBy', 'name avatar reputation')
        .populate('assignedTo.department', 'name description contactEmail contactPhone')
        .populate('routing.suggestedDepartment', 'name')
        .populate('asset', 'assetCode name type location installedAt lastRepairedAt status')
        .lean(),
      getServerSession(authOptions)
    ]);
    if (!report) return apiError('Report not found.', 404);
    const ownerId = report.submittedBy?._id?.toString();
    const viewerId = session?.user?.id;
    const communityCounts = Object.fromEntries(['still_exists', 'no_longer_exists', 'incorrect'].map((value) => [value, (report.communityVerifications || []).filter((item) => item.verdict === value).length]));
    const viewerVerdict = viewerId ? report.communityVerifications?.find((item) => item.user?.toString() === viewerId)?.verdict : null;
    const canViewAppeals = Boolean(session?.user && (ownerId === viewerId || session.user.role === 'admin'));
    return NextResponse.json({
      ...report,
      submittedBy: report.submittedBy
        ? { name: report.submittedBy.name, avatar: report.submittedBy.avatar, reputation: report.submittedBy.reputation }
        : null,
      statusHistory: (report.statusHistory || []).map(({ status, timestamp, comment }) => ({
        status,
        timestamp,
        comment
      })),
      impactCount: report.impactConfirmations?.length || 0,
      communityCounts,
      impactConfirmations: undefined,
      communityVerifications: undefined,
      appeals: canViewAppeals ? (report.appeals || []).map(({ _id, reason, status, createdAt, reviewedAt, response }) => ({ _id, reason, status, createdAt, reviewedAt, response })) : undefined,
      viewer: {
        canEdit: Boolean(session?.user && ownerId === session.user.id && ['submitted', 'in_review'].includes(report.status)),
        isAdmin: session?.user?.role === 'admin',
        isOwner: Boolean(session?.user && ownerId === session.user.id),
        hasConfirmedImpact: Boolean(viewerId && report.impactConfirmations?.some((item) => item.user?.toString() === viewerId)),
        communityVerdict: viewerVerdict,
        canReviewResolution: Boolean(session?.user && ownerId === session.user.id && report.status === 'resolved'),
        canAppeal: Boolean(session?.user && ownerId === session.user.id && report.status === 'disputed' && !(report.appeals || []).some((item) => item.status === 'pending'))
      }
    });
  } catch (error) {
    console.error('Unable to fetch report:', error);
    return apiError('Unable to load this report.', 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError('Please sign in to update a report.', 401);
    const id = await resolveId(params);
    if (!isValidObjectId(id)) return apiError('Invalid report ID.', 400);
    await dbConnect();

    const report = await Report.findOne({ _id: id, deletedAt: { $exists: false } });
    if (!report) return apiError('Report not found.', 404);
    if (report.submittedBy.toString() !== session.user.id) return apiError('You cannot edit this report.', 403);
    if (!['submitted', 'in_review'].includes(report.status)) {
      return apiError('This report can no longer be edited because work has started.', 409);
    }

    const parsed = parseCitizenReport(await request.json(), { partial: true });
    if (!parsed.valid) return apiError('Please correct the report details.', 400, parsed.errors);
    Object.assign(report, parsed.value);
    await report.save();
    return NextResponse.json(report);
  } catch (error) {
    console.error('Unable to update report:', error);
    return apiError('Unable to update this report.', 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError('Please sign in to delete a report.', 401);
    const id = await resolveId(params);
    if (!isValidObjectId(id)) return apiError('Invalid report ID.', 400);
    await dbConnect();

    const report = await Report.findOne({ _id: id, deletedAt: { $exists: false } });
    if (!report) return apiError('Report not found.', 404);
    const isAdmin = session.user.role === 'admin';
    const isOwner = report.submittedBy.toString() === session.user.id;
    if (!isAdmin && !isOwner) return apiError('You cannot delete this report.', 403);
    if (!isAdmin && !['submitted', 'in_review'].includes(report.status)) {
      return apiError('This report can no longer be removed because work has started.', 409);
    }

    report.deletedAt = new Date();
    await report.save({ validateBeforeSave: false });
    return NextResponse.json({ message: 'Report removed successfully.' });
  } catch (error) {
    console.error('Unable to delete report:', error);
    return apiError('Unable to remove this report.', 500);
  }
}
