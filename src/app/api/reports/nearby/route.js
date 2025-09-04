// File: c:\hackathon\src\app\api\reports\nearby\route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Report from '@/model/Report';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    
    // Get location parameters
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const maxDistance = parseInt(searchParams.get('distance') || '1000'); // in meters, default 1km
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }
    
    // Perform geospatial query
    const reports = await Report.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat] // GeoJSON uses [longitude, latitude]
          },
          $maxDistance: maxDistance
        }
      }
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('submittedBy', 'name')
    .populate('assignedTo.department', 'name');
    
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching nearby reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nearby reports' },
      { status: 500 }
    );
  }
}