// File: c:\hackathon\src\app\api\reports\route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Report from '@/model/Report';

// Get all reports with optional filtering
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Build query
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    
    // Get reports with pagination
    const skip = (page - 1) * limit;
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('submittedBy', 'name email')
      .populate('assignedTo.department', 'name');
    
    const total = await Report.countDocuments(query);
    
    return NextResponse.json({
      reports,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// Create a new report
export async function POST(request) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to submit a report' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Create new report
    const report = new Report({
      ...data,
      submittedBy: session.user.id,
      statusHistory: [{
        status: 'submitted',
        timestamp: new Date(),
        comment: 'Report submitted'
      }]
    });
    
    await report.save();
    
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}