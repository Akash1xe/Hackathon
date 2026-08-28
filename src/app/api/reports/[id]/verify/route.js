import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { calculateTrust, haversineMeters, reputationTier } from '@/lib/civicIntelligence';
import { cleanText, isValidObjectId } from '@/lib/validation';
import Report from '@/model/Report';
import User from '@/model/User';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError('Please sign in to verify this issue.', 401);
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError('Invalid report ID.', 400);
    const body = await request.json();
    const verdict = cleanText(body.verdict, 30);
    const coordinates = Array.isArray(body.coordinates) ? body.coordinates.map(Number) : [];
    if (!['still_exists', 'no_longer_exists', 'incorrect'].includes(verdict)) return apiError('Choose a valid verification.', 400);
    if (coordinates.length !== 2 || coordinates.some((value) => !Number.isFinite(value))) return apiError('Share your current location to verify nearby issues.', 400);
    await dbConnect();
    const report = await Report.findOne({ _id: id, deletedAt: { $exists: false } });
    if (!report) return apiError('Report not found.', 404);
    const distanceMeters = Math.round(haversineMeters(coordinates, report.location.coordinates));
    if (distanceMeters > 1000) return apiError('Community verification is limited to citizens within 1 km of the issue.', 403);
    const existing = report.communityVerifications.find((item) => item.user.toString() === session.user.id);
    if (existing) { existing.verdict = verdict; existing.distanceMeters = distanceMeters; existing.createdAt = new Date(); }
    else report.communityVerifications.push({ user: session.user.id, verdict, distanceMeters, createdAt: new Date() });
    report.trust = calculateTrust(report);
    await report.save();

    const user = await User.findById(session.user.id);
    if (user && !existing) {
      user.reputation ??= {};
      user.reputation.communityValidations = (user.reputation.communityValidations || 0) + 1;
      user.reputation.score = (user.reputation.score || 0) + 2;
      user.reputation.tier = reputationTier(user.reputation.score);
      await user.save({ validateBeforeSave: false });
    }
    const counts = Object.fromEntries(['still_exists', 'no_longer_exists', 'incorrect'].map((value) => [value, report.communityVerifications.filter((item) => item.verdict === value).length]));
    return NextResponse.json({ counts, trust: report.trust, viewerVerdict: verdict });
  } catch (error) {
    console.error('Unable to verify report:', error);
    return apiError('Unable to record this verification.', 500);
  }
}
