import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { apiError, parsePagination } from '@/lib/http';
import Report from '@/model/Report';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = Number(searchParams.get('lat'));
    const longitude = Number(searchParams.get('lng'));
    const distance = Math.min(25_000, Math.max(100, Number(searchParams.get('distance') || 1000)));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return apiError('Invalid coordinates.', 400);
    const { limit } = parsePagination(searchParams, { limit: 20, maxLimit: 50 });
    await dbConnect();
    const reports = await Report.find({
      deletedAt: { $exists: false },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: distance
        }
      }
    })
      .select('referenceId title description location category status priority images submittedBy assignedTo resolvedAt createdAt updatedAt')
      .limit(limit)
      .populate('submittedBy', 'name avatar -_id')
      .populate('assignedTo.department', 'name');
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Unable to load nearby reports:', error);
    return apiError('Unable to load nearby reports.', 500);
  }
}
