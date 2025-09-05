// File: c:\hackathon\src\app\api\admin\reports\[id]\route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Report from '@/model/Report';
import User from '@/model/User';
import Notification from '@/model/Notification';
import mongoose from 'mongoose';

// GET a single report (admin access)
export async function GET(request, { params }) {
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
    
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid report ID format' },
        { status: 400 }
      );
    }
    
    const report = await Report.findById(id)
      .populate('submittedBy', 'name email phone');
    
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

// UPDATE a report (admin access)
export async function PATCH(request, { params }) {
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
    
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid report ID format' },
        { status: 400 }
      );
    }
    
    // Find the report
    const report = await Report.findById(id).populate('submittedBy', 'name email');
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    const { status, adminComment, sendNotification } = data;
    
    // Track if status is being changed
    const statusChanged = status && status !== report.status;
    
    // Build update data
    const updateData = {};
    if (status) updateData.status = status;
    if (adminComment) updateData.adminComment = adminComment;
    
    // Apply updates
    const updatedReport = await Report.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    // Send notification to report submitter if requested
    if (sendNotification && report.submittedBy) {
      let title, message;
      
      if (statusChanged && status === 'resolved') {
        title = 'Your Report Has Been Resolved';
        message = `Your report "${report.title}" has been marked as resolved. Thank you for your contribution.`;
      } else if (statusChanged) {
        title = `Report Status Updated: ${formatStatus(status)}`;
        message = `Your report "${report.title}" has been updated to ${formatStatus(status)}.`;
      } else if (adminComment) {
        title = 'Admin Comment on Your Report';
        message = `An admin has added a comment to your report "${report.title}": ${adminComment}`;
      } else {
        title = 'Update on Your Report';
        message = `There has been an update to your report "${report.title}".`;
      }
      
      // Create notification
      const notification = new Notification({
        recipient: report.submittedBy._id,
        type: statusChanged ? 'report_status_change' : 'comment_added',
        title,
        message,
        relatedReport: report._id,
        read: false
      });
      
      await notification.save();
      
      // Add notification to user's notifications array
      await User.findByIdAndUpdate(
        report.submittedBy._id,
        { $push: { notifications: notification._id } }
      );
    }
    
    return NextResponse.json({
      message: 'Report updated successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

// Helper function to format status for display
function formatStatus(status) {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}