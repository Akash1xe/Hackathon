import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { cleanText, isValidObjectId } from '@/lib/validation';
import Report from '@/model/Report';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError('Please sign in to appeal this resolution.', 401);
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError('Invalid report ID.', 400);
    const reason = cleanText((await request.json()).reason, 1200);
    if (reason.length < 20) return apiError('Explain the unresolved problem in at least 20 characters.', 400);
    await dbConnect();
    const report = await Report.findOne({ _id: id, deletedAt: { $exists: false } });
    if (!report) return apiError('Report not found.', 404);
    if (report.submittedBy.toString() !== session.user.id) return apiError('Only the reporting citizen can appeal.', 403);
    if (report.status !== 'disputed') return apiError('Submit negative resolution feedback before appealing.', 409);
    if (report.appeals.some((item) => item.status === 'pending')) return apiError('An appeal is already awaiting review.', 409);
    report.appeals.push({ reason, status: 'pending', createdBy: session.user.id, createdAt: new Date() });
    report.statusHistory.push({ status: 'disputed', timestamp: new Date(), comment: 'Citizen submitted an appeal for supervisor review.', changedBy: session.user.id });
    await report.save();
    return NextResponse.json({ message: 'Appeal submitted for supervisor review.', appeal: report.appeals.at(-1) }, { status: 201 });
  } catch (error) {
    console.error('Unable to submit appeal:', error);
    return apiError('Unable to submit this appeal.', 500);
  }
}
