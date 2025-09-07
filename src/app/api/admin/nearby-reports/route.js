// File: c:\hackathon\src\app\api\admin\nearby-reports\route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Report from '@/model/Report';

export async function GET(request) {
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
    
    const { searchParams } = new URL(request.url);
    
    // Required parameters
    const lng = parseFloat(searchParams.get('lng'));
    const lat = parseFloat(searchParams.get('lat'));
    const maxDistance = parseInt(searchParams.get('distance') || '1000'); // Default 1km
    
    // Validate coordinates
    if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'Invalid coordinates provided' },
        { status: 400 }
      );
    }
    
    // Optional filters
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Build query for geospatial search
    const query = {
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat] // GeoJSON uses [longitude, latitude] order
          },
          $maxDistance: maxDistance
        }
      }
    };
    
    // Add optional filters
    if (status) query.status = status;
    if (category) query.category = category;
    
    // Find nearby reports
    const reports = await Report.find(query)
      .select('_id title description category status priority location createdAt')
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return NextResponse.json({
      reports,
      center: [lng, lat],
      distance: maxDistance
    });
  } catch (error) {
    console.error('Error fetching nearby reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nearby reports' },
      { status: 500 }
    );
  }
}