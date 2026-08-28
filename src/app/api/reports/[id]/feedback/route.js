import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { calculateTrust, reputationTier } from '@/lib/civicIntelligence';
import { cleanText, isValidObjectId } from '@/lib/validation';
import Report from '@/model/Report';
import User from '@/model/User';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError('Please sign in to review this resolution.', 401);
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError('Invalid report ID.', 400);
    const body = await request.json();
    const rating = Number(body.rating);
    const resolved = Boolean(body.resolved);
    const comment = cleanText(body.comment, 800);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return apiError('Choose a rating from 1 to 5.', 400);
    await dbConnect();
    const report = await Report.findOne({ _id: id, deletedAt: { $exists: false } });
    if (!report) return apiError('Report not found.', 404);
    if (report.submittedBy.toString() !== session.user.id) return apiError('Only the reporting citizen can review this resolution.', 403);
    if (!['resolved', 'disputed'].includes(report.status)) return apiError('This case is not awaiting resolution feedback.', 409);

    report.citizenFeedback = { rating, resolved, comment, submittedAt: new Date() };
    const nextStatus = resolved && rating >= 3 ? 'citizen_confirmed' : 'disputed';
    report.status = nextStatus;
    report.statusHistory.push({ status: nextStatus, timestamp: new Date(), comment: resolved ? `Citizen confirmed resolution with ${rating} stars.` : `Citizen disputed the resolution with ${rating} stars.`, changedBy: session.user.id });
    report.trust = calculateTrust(report);
    await report.save();

    if (nextStatus === 'citizen_confirmed') {
      const user = await User.findById(session.user.id);
      if (user) {
        user.reputation ??= {};
        user.reputation.resolvedReports = (user.reputation.resolvedReports || 0) + 1;
        user.reputation.score = (user.reputation.score || 0) + 5;
        user.reputation.tier = reputationTier(user.reputation.score);
        await user.save({ validateBeforeSave: false });
      }
    }
    return NextResponse.json({ status: report.status, feedback: report.citizenFeedback, trust: report.trust, appealAvailable: nextStatus === 'disputed' });
  } catch (error) {
    console.error('Unable to save resolution feedback:', error);
    return apiError('Unable to save your resolution feedback.', 500);
  }
}
