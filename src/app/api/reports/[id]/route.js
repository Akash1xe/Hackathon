// File: c:\hackathon\src\app\api\reports\[id]\route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Report from '@/model/Report';
import mongoose from 'mongoose';

// Helper to check if ID is valid
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Get a single report
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const id = params.id;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }
    
    const report = await Report.findById(id)
      .populate('submittedBy', 'name email')
      .populate('assignedTo.department', 'name');
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

// Update a report
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update a report' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Find the report
    const report = await Report.findById(id);
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    // Check permissions
    // If not admin and not the submitter, deny access
    if (session.user.role !== 'admin' && 
        report.submittedBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to update this report' },
        { status: 403 }
      );
    }
    
    // Handle status change
    if (data.status && data.status !== report.status) {
      report.statusHistory.push({
        status: data.status,
        timestamp: new Date(),
        comment: data.statusComment || `Status changed to ${data.status}`
      });
      
      // If status is resolved, set resolvedAt
      if (data.status === 'resolved') {
        report.resolvedAt = new Date();
      }
    }
    
    // Update allowed fields
    const allowedFields = ['title', 'description', 'category', 'status', 'priority', 'images'];
    
    // Admin-only fields
    if (session.user.role === 'admin') {
      allowedFields.push('assignedTo');
    }
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        report[field] = data[field];
      }
    });
    
    // Always update the updatedAt field
    report.updatedAt = new Date();
    
    await report.save();
    
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

// Delete a report
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete a report' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }
    
    const report = await Report.findById(id);
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    // Only admins or the original submitter can delete a report
    if (session.user.role !== 'admin' && 
        report.submittedBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this report' },
        { status: 403 }
      );
    }
    
    await Report.findByIdAndDelete(id);
    
    return NextResponse.json(
      { message: 'Report deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}