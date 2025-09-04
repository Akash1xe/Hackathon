// File: c:\hackathon\src\app\api\admin\stats\route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Report from '@/model/Report';
import User from '@/model/User';
import Department from '@/model/Department';

// Get admin dashboard statistics
export async function GET(request) {
  try {
    await dbConnect();
    
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Count total reports by status
    const reportsByStatus = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Format report status counts
    const statusCounts = {};
    reportsByStatus.forEach(item => {
      statusCounts[item._id] = item.count;
    });
    
    // Count reports by category
    const reportsByCategory = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    // Format category counts
    const categoryCounts = {};
    reportsByCategory.forEach(item => {
      categoryCounts[item._id] = item.count;
    });
    
    // Get recent reports
    const recentReports = await Report.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('submittedBy', 'name')
      .populate('assignedTo.department', 'name');
    
    // Count total users
    const totalUsers = await User.countDocuments();
    
    // Count total departments
    const totalDepartments = await Department.countDocuments();
    
    // Calculate average resolution time (for resolved reports)
    const resolvedReports = await Report.find({ 
      status: 'resolved',
      resolvedAt: { $exists: true }
    });
    
    let avgResolutionTimeHours = 0;
    if (resolvedReports.length > 0) {
      const totalResolutionTime = resolvedReports.reduce((total, report) => {
        const createdDate = new Date(report.createdAt);
        const resolvedDate = new Date(report.resolvedAt);
        const diffMs = resolvedDate - createdDate;
        const diffHours = diffMs / (1000 * 60 * 60);
        return total + diffHours;
      }, 0);
      
      avgResolutionTimeHours = totalResolutionTime / resolvedReports.length;
    }
    
    return NextResponse.json({
      totalReports: await Report.countDocuments(),
      statusCounts,
      categoryCounts,
      recentReports,
      totalUsers,
      totalDepartments,
      avgResolutionTimeHours
    });
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}