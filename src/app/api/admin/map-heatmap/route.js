// File: c:\hackathon\src\app\api\admin\map-heatmap\route.js
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
    
    // Optional filters
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priorityWeight = searchParams.get('priorityWeight') === 'true';
    
    // Build match query
    const matchQuery = {
      'location.coordinates': { $exists: true, $type: 'array' }
    };
    
    if (status) matchQuery.status = status;
    if (category) matchQuery.category = category;
    
    // Get reports with valid location data
    const reports = await Report.find(matchQuery)
      .select('location priority');
    
    // Format data for heatmap
    const heatmapData = reports.map(report => {
      // Get coordinates - for heatmaps, they're usually [lat, lng] instead of [lng, lat]
      const [lng, lat] = report.location.coordinates;
      
      // Assign weight based on priority if requested
      let weight = 1;
      if (priorityWeight) {
        switch(report.priority) {
          case 'low':
            weight = 0.5;
            break;
          case 'medium':
            weight = 1;
            break;
          case 'high':
            weight = 1.5;
            break;
          case 'urgent':
            weight = 2;
            break;
          default:
            weight = 1;
        }
      }
      
      // Return point in format [lat, lng, weight] that most heatmap libraries expect
      return {
        lat,
        lng,
        weight
      };
    });
    
    return NextResponse.json({ heatmapData });
  } catch (error) {
    console.error('Error generating heatmap data:', error);
    return NextResponse.json(
      { error: 'Failed to generate heatmap data' },
      { status: 500 }
    );
  }
}