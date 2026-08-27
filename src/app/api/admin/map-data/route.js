import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { CATEGORY_VALUES, STATUS_VALUES } from '@/lib/constants';
import { cleanText } from '@/lib/validation';
import Report from '@/model/Report';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return apiError('Administrator access required.', 403);
    const { searchParams } = new URL(request.url);
    const status = cleanText(searchParams.get('status'), 30);
    const category = cleanText(searchParams.get('category'), 40);
    const days = Math.min(3650, Math.max(0, Number(searchParams.get('days') || 90)));
    const query = { deletedAt: { $exists: false }, 'location.coordinates.1': { $exists: true } };
    if (STATUS_VALUES.includes(status)) query.status = status;
    if (CATEGORY_VALUES.includes(category)) query.category = category;
    if (days) query.createdAt = { $gte: new Date(Date.now() - days * 86_400_000) };
    await dbConnect();
    const reports = await Report.find(query).select('referenceId title category status priority location createdAt').sort({ createdAt: -1 }).limit(2000);
    return NextResponse.json({ mapData: reports.map((report) => ({ id: report._id, referenceId: report.referenceId, title: report.title, category: report.category, status: report.status, priority: report.priority, location: report.location, createdAt: report.createdAt })) });
  } catch (error) {
    console.error('Unable to load map reports:', error);
    return apiError('Unable to load the city map.', 500);
  }
}
