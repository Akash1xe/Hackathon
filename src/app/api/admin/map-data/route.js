// File: c:\hackathon\src\app\api\admin\map-data\route.js

// in this file the admin are retrieving the map data for the reports

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
    const days = parseInt(searchParams.get('days') || '30');
    
    // Build query
    const query = {};
    
    // Add status filter if provided
    if (status) query.status = status;
    
    // Add category filter if provided
    if (category) query.category = category;
    
    // Add date filter - only show reports from the last X days
    if (days > 0) {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);
      query.createdAt = { $gte: dateThreshold };
    }
    
    // Ensure we only get reports with valid location data
    query['location.coordinates'] = { $exists: true, $type: 'array' };
    
    // Get reports with location data
    const reports = await Report.find(query)
      .select('_id title description category status priority location createdAt')
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });
    
    // Format the data for map display
    const mapData = reports.map(report => ({
      id: report._id.toString(),
      title: report.title,
      description: report.description,
      category: report.category,
      status: report.status,
      priority: report.priority,
      location: {
        coordinates: report.location.coordinates,
        address: report.location.address
      },
      submittedBy: report.submittedBy ? {
        name: report.submittedBy.name,
        email: report.submittedBy.email
      } : null,
      createdAt: report.createdAt
    }));
    
    return NextResponse.json({ mapData });
  } catch (error) {
    console.error('Error fetching map data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map data' },
      { status: 500 }
    );
  }
}