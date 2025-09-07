// File: c:\hackathon\src\app\api\admin\area-reports\route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Report from '@/model/Report';

export async function POST(request) {
  try {
    await dbConnect();
    
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    const { polygon, status, category } = data;
    
    // Validate polygon data
    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      return NextResponse.json(
        { error: 'Invalid polygon: must be an array of at least 3 coordinate pairs' },
        { status: 400 }
      );
    }
    
    // Ensure polygon is closed (first and last points are the same)
    const closedPolygon = [...polygon];
    if (JSON.stringify(closedPolygon[0]) !== JSON.stringify(closedPolygon[closedPolygon.length - 1])) {
      closedPolygon.push(closedPolygon[0]);
    }
    
    // Build query
    const query = {
      'location.coordinates': {
        $geoWithin: {
          $geometry: {
            type: 'Polygon',
            coordinates: [closedPolygon]
          }
        }
      }
    };
    
    // Add optional filters
    if (status) query.status = status;
    if (category) query.category = category;
    
    // Find reports within the polygon
    const reports = await Report.find(query)
      .select('_id title description category status priority location createdAt')
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });
    
    // Get stats for the area
    const statusCounts = await Report.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const categoryCounts = await Report.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    return NextResponse.json({
      reports,
      totalCount: reports.length,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byCategory: categoryCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching reports by area:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports by area' },
      { status: 500 }
    );
  }
}