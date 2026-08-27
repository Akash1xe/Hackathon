import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import Report from '@/model/Report';
import User from '@/model/User';
import Department from '@/model/Department';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return apiError('Administrator access required.', 403);
    await dbConnect();
    const match = { deletedAt: { $exists: false } };

    const [statusRows, categoryRows, recentReports, totalUsers, totalDepartments, resolutionRows, totalReports] = await Promise.all([
      Report.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Report.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
      Report.find(match).sort({ createdAt: -1 }).limit(6).populate('submittedBy', 'name').populate('assignedTo.department', 'name'),
      User.countDocuments({ active: { $ne: false } }),
      Department.countDocuments({ active: true }),
      Report.aggregate([{ $match: { ...match, status: 'resolved', resolvedAt: { $type: 'date' } } }, { $project: { duration: { $subtract: ['$resolvedAt', '$createdAt'] } } }, { $group: { _id: null, average: { $avg: '$duration' } } }]),
      Report.countDocuments(match)
    ]);

    return NextResponse.json({
      totalReports,
      totalUsers,
      totalDepartments,
      statusCounts: Object.fromEntries(statusRows.map((row) => [row._id, row.count])),
      categoryCounts: Object.fromEntries(categoryRows.map((row) => [row._id, row.count])),
      recentReports,
      avgResolutionTimeHours: Math.round(((resolutionRows[0]?.average || 0) / 3_600_000) * 10) / 10
    });
  } catch (error) {
    console.error('Unable to load admin dashboard:', error);
    return apiError('Unable to load dashboard statistics.', 500);
  }
}
