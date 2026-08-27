import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError, parsePagination } from '@/lib/http';
import { CATEGORY_VALUES, STATUS_VALUES } from '@/lib/constants';
import { cleanText, escapeRegex } from '@/lib/validation';
import Report from '@/model/Report';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return apiError('Administrator access required.', 403);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams, { limit: 12, maxLimit: 100 });
    const status = cleanText(searchParams.get('status'), 30);
    const category = cleanText(searchParams.get('category'), 40);
    const search = cleanText(searchParams.get('search'), 100);
    const query = { deletedAt: { $exists: false } };
    if (STATUS_VALUES.includes(status)) query.status = status;
    if (CATEGORY_VALUES.includes(category)) query.category = category;
    if (search) {
      const safe = escapeRegex(search);
      query.$or = [{ referenceId: { $regex: safe, $options: 'i' } }, { title: { $regex: safe, $options: 'i' } }, { 'location.address': { $regex: safe, $options: 'i' } }];
    }

    const [reports, total] = await Promise.all([
      Report.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('submittedBy', 'name email phone')
        .populate('assignedTo.department', 'name'),
      Report.countDocuments(query)
    ]);
    return NextResponse.json({ reports, pagination: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    console.error('Unable to load admin reports:', error);
    return apiError('Unable to load reports.', 500);
  }
}
