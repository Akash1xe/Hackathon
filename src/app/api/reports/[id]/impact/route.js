import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { calculateRisk, calculateTrust, reputationTier } from '@/lib/civicIntelligence';
import { isValidObjectId } from '@/lib/validation';
import Report from '@/model/Report';
import User from '@/model/User';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError('Please sign in to confirm community impact.', 401);
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError('Invalid report ID.', 400);
    await dbConnect();
    const report = await Report.findOne({ _id: id, deletedAt: { $exists: false } });
    if (!report) return apiError('Report not found.', 404);
    if (report.submittedBy.toString() === session.user.id) return apiError('You already reported this issue.', 409);
    if (['resolved', 'citizen_confirmed', 'rejected'].includes(report.status)) return apiError('This case is no longer accepting impact confirmations.', 409);
    if (report.impactConfirmations.some((item) => item.user.toString() === session.user.id)) return apiError('You already confirmed this issue affects you.', 409);

    report.impactConfirmations.push({ user: session.user.id, createdAt: new Date() });
    const ageHours = (Date.now() - report.createdAt.getTime()) / 3_600_000;
    const overriddenByAdmin = Boolean(report.risk?.overriddenByAdmin);
    const previousFactors = report.risk?.factors || {};
    report.risk = {
      ...calculateRisk({
        evidenceSeverity: report.evidenceAnalysis?.severity,
        confirmations: report.impactConfirmations.length,
        ageHours,
        sensitiveLocation: Number(previousFactors.locationSensitivity || 0) >= 20,
        nearbyReports: Math.round(Number(previousFactors.nearbyReports || 0) / 2),
        recurrence: Number(previousFactors.recurrence || 0)
      }),
      overriddenByAdmin
    };
    if (!overriddenByAdmin) report.priority = report.risk.label;
    report.trust = calculateTrust(report);
    await report.save();

    const user = await User.findById(session.user.id);
    if (user) {
      user.reputation ??= {};
      user.reputation.usefulConfirmations = (user.reputation.usefulConfirmations || 0) + 1;
      user.reputation.score = (user.reputation.score || 0) + 2;
      user.reputation.tier = reputationTier(user.reputation.score);
      await user.save({ validateBeforeSave: false });
    }
    return NextResponse.json({ impactCount: report.impactConfirmations.length, risk: report.risk, trust: report.trust });
  } catch (error) {
    console.error('Unable to confirm report impact:', error);
    return apiError('Unable to record your confirmation.', 500);
  }
}
