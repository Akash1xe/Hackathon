import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Report from '@/model/Report';
import Department from '@/model/Department';
import { 
  notifyReportStatusChange, 
  notifyReportAssigned, 
  notifyReportResolved 
} from '@/lib/createNotification';

// Get a specific report by ID
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const id = params.id;
    
    // Find the report and populate related fields
    const report = await Report.findById(id)
      .populate('submittedBy', 'name email')
      .populate('assignedTo.department', 'name contactInfo');
    
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
    
    const id = params.id;
    const data = await request.json();
    
    // Get the session to check permissions
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update a report' },
        { status: 401 }
      );
    }
    
    // Find the report
    const report = await Report.findById(id);
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update this report
    const isAdmin = session.user.role === 'admin';
    const isOwner = session.user.id === report.submittedBy.toString();
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to update this report' },
        { status: 403 }
      );
    }
    
    // If updating status, add to status history
    if (data.status && data.status !== report.status) {
      const statusUpdate = {
        status: data.status,
        timestamp: new Date(),
        comment: data.statusComment || `Status updated to ${data.status}`
      };
      
      // Add to status history array
      data.statusHistory = [statusUpdate, ...(report.statusHistory || [])];
      
      // Set resolved date if status is 'resolved'
      if (data.status === 'resolved') {
        data.resolvedAt = new Date();
      }
      
      // Store old status for notification
      const oldStatus = report.status;
      
      // If report is being assigned to a department
      if (data.status === 'assigned' && data.assignedTo && data.assignedTo.department) {
        try {
          // Get department details
          const department = await Department.findById(data.assignedTo.department);
          
          // Notify the report owner
          await notifyReportAssigned(
            report.submittedBy, 
            report._id, 
            report.title, 
            department._id,
            department.name
          );
        } catch (notifyError) {
          console.error('Error sending assignment notification:', notifyError);
          // Continue with the update even if notification fails
        }
      }
      
      // If report is being resolved
      if (data.status === 'resolved') {
        try {
          await notifyReportResolved(
            report.submittedBy, 
            report._id, 
            report.title
          );
        } catch (notifyError) {
          console.error('Error sending resolution notification:', notifyError);
        }
      }
      
      // For all status changes, notify the report owner
      try {
        await notifyReportStatusChange(
          report.submittedBy, 
          report._id, 
          report.title, 
          oldStatus, 
          data.status
        );
      } catch (notifyError) {
        console.error('Error sending status change notification:', notifyError);
      }
    }
    
    // Set the updated timestamp
    data.updatedAt = new Date();
    
    // Update the report
    const updatedReport = await Report.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('submittedBy', 'name email')
     .populate('assignedTo.department', 'name contactInfo');
    
    return NextResponse.json(updatedReport);
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
    
    const id = params.id;
    
    // Get the session to check permissions
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete a report' },
        { status: 401 }
      );
    }
    
    // Only admins or the report owner can delete a report
    const report = await Report.findById(id);
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    const isAdmin = session.user.role === 'admin';
    const isOwner = session.user.id === report.submittedBy.toString();
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this report' },
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