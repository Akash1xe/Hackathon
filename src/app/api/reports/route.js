import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError, parsePagination, requestIp } from '@/lib/http';
import { checkRateLimit } from '@/lib/rateLimit';
import { notifyAdminsNewReport } from '@/lib/createNotification';
import { CATEGORY_VALUES, STATUS_VALUES } from '@/lib/constants';
import { cleanText, escapeRegex, parseCitizenReport } from '@/lib/validation';
import Report from '@/model/Report';

const PUBLIC_SELECT = 'referenceId title description location category status priority images submittedBy assignedTo resolvedAt createdAt updatedAt';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const category = cleanText(searchParams.get('category'), 40);
    const status = cleanText(searchParams.get('status'), 30);
    const search = cleanText(searchParams.get('search'), 100);
    const mine = searchParams.get('mine') === 'true';
    const session = mine ? await getServerSession(authOptions) : null;
    if (mine && !session?.user) return apiError('Please sign in to view your reports.', 401);

    const query = { deletedAt: { $exists: false } };
    if (mine) query.submittedBy = session.user.id;
    if (CATEGORY_VALUES.includes(category)) query.category = category;
    if (STATUS_VALUES.includes(status)) query.status = status;
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { referenceId: { $regex: safeSearch, $options: 'i' } },
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { 'location.address': { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const summaryPromise = mine
      ? Report.aggregate([
        { $match: { deletedAt: { $exists: false }, submittedBy: new mongoose.Types.ObjectId(session.user.id) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
      : Promise.resolve(null);
    const [reports, total, summaryRows] = await Promise.all([
      Report.find(query).select(PUBLIC_SELECT).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('submittedBy', 'name avatar -_id')
        .populate('assignedTo.department', 'name'),
      Report.countDocuments(query),
      summaryPromise
    ]);

    const summary = summaryRows
      ? {
        total: summaryRows.reduce((sum, row) => sum + row.count, 0),
        open: summaryRows.filter((row) => !['resolved', 'rejected'].includes(row._id)).reduce((sum, row) => sum + row.count, 0),
        resolved: summaryRows.find((row) => row._id === 'resolved')?.count || 0
      }
      : undefined;

    return NextResponse.json({
      reports,
      pagination: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
      ...(summary ? { summary } : {})
    });
  } catch (error) {
    console.error('Unable to fetch reports:', error);
    return apiError('Unable to load reports right now.', 500);
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError('Please sign in to submit a report.', 401);
    const rate = checkRateLimit(`report:${session.user.id}:${requestIp(request)}`, { limit: 8, windowMs: 60 * 60_000 });
    if (!rate.allowed) return apiError('You have submitted several reports recently. Please try again later.', 429);

    const parsed = parseCitizenReport(await request.json());
    if (!parsed.valid) return apiError('Please correct the report details.', 400, parsed.errors);
    await dbConnect();
    const report = await Report.create({
      ...parsed.value,
      submittedBy: session.user.id,
      status: 'submitted',
      priority: 'medium',
      statusHistory: [{ status: 'submitted', timestamp: new Date(), comment: 'Report submitted by citizen', changedBy: session.user.id }]
    });

    notifyAdminsNewReport(report._id, report.title, session.user.name).catch((error) => {
      console.error('Unable to notify administrators:', error);
    });
    return NextResponse.json({ _id: report._id, referenceId: report.referenceId }, { status: 201 });
  } catch (error) {
    console.error('Unable to create report:', error);
    return apiError('Unable to submit your report right now.', 500);
  }
}
