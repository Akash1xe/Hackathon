// File: c:\hackathon\src\app\api\admin\map-stats\route.js
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
    
    // Get stats by status
    const statusStats = await Report.aggregate([
      {
        $match: {
          'location.coordinates': { $exists: true, $type: 'array' }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get stats by category
    const categoryStats = await Report.aggregate([
      {
        $match: {
          'location.coordinates': { $exists: true, $type: 'array' }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get stats by priority
    const priorityStats = await Report.aggregate([
      {
        $match: {
          'location.coordinates': { $exists: true, $type: 'array' }
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get trend data (reports over time)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const trendData = await Report.aggregate([
      {
        $match: {
          'location.coordinates': { $exists: true, $type: 'array' },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get total count
    const total = await Report.countDocuments({
      'location.coordinates': { $exists: true, $type: 'array' }
    });
    
    // Format the results to be more easily consumable
    const formatStats = (stats) => {
      return stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});
    };
    
    return NextResponse.json({
      total,
      byStatus: formatStats(statusStats),
      byCategory: formatStats(categoryStats),
      byPriority: formatStats(priorityStats),
      trend: trendData.map(item => ({
        date: item._id,
        count: item.count
      }))
    });
  } catch (error) {
    console.error('Error fetching map statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map statistics' },
      { status: 500 }
    );
  }
}