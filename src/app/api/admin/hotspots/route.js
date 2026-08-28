import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import Report from '@/model/Report';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return apiError('Administrator access required.', 403);
    await dbConnect();
    const since = new Date(Date.now() - 90 * 86_400_000);
    const reports = await Report.find({ deletedAt: { $exists: false }, createdAt: { $gte: since }, 'location.coordinates.1': { $exists: true } }).select('category location createdAt status').lean();
    const cells = new Map();
    for (const report of reports) {
      const [lng, lat] = report.location.coordinates;
      const key = `${lat.toFixed(2)},${lng.toFixed(2)},${report.category}`;
      const cell = cells.get(key) || { category: report.category, latitude: Number(lat.toFixed(2)), longitude: Number(lng.toFixed(2)), address: report.location.address, reports: 0, unresolved: 0 };
      cell.reports++;
      if (!['resolved', 'citizen_confirmed', 'rejected'].includes(report.status)) cell.unresolved++;
      cells.set(key, cell);
    }
    const hotspots = [...cells.values()].map((cell) => ({ ...cell, probability14Days: Math.min(95, Math.round(25 + cell.reports * 9 + cell.unresolved * 4)), trend: cell.reports >= 5 ? 'high' : cell.reports >= 3 ? 'emerging' : 'watch' })).sort((a, b) => b.probability14Days - a.probability14Days).slice(0, 20);
    return NextResponse.json({ periodDays: 90, hotspots });
  } catch (error) {
    console.error('Unable to calculate civic hotspots:', error);
    return apiError('Unable to calculate civic hotspots.', 500);
  }
}
