import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import Report from '@/model/Report';
import Department from '@/model/Department';

export async function GET() {
  try {
    await dbConnect();
    const base = { deletedAt: { $exists: false } };
    const [totalReports, resolvedReports, activeReports, departments] = await Promise.all([
      Report.countDocuments(base),
      Report.countDocuments({ ...base, status: 'resolved' }),
      Report.countDocuments({ ...base, status: { $in: ['submitted', 'in_review', 'assigned', 'in_progress'] } }),
      Department.countDocuments({ active: true })
    ]);
    return NextResponse.json({ totalReports, resolvedReports, activeReports, departments });
  } catch (error) {
    console.error('Unable to load public statistics:', error);
    return apiError('Unable to load public statistics.', 500);
  }
}
