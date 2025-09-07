// File: c:\hackathon\src\app\api\admin\map-clusters\route.js

//instead of returning every single report, it groups them into “buckets” or “clusters” for display on the map.

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
    const zoom = parseInt(searchParams.get('zoom') || '10'); // Map zoom level
    
    // Determine grid size based on zoom level
    // The higher the zoom, the smaller the grid cells
    const gridSize = Math.max(0.01, 0.1 / Math.pow(2, zoom - 10));
    
    // Build match query
    const matchQuery = {
      'location.coordinates': { $exists: true, $type: 'array' }
    };
    
    if (status) matchQuery.status = status;
    if (category) matchQuery.category = category;
    
    // Perform aggregation to create clusters
    const clusters = await Report.aggregate([
      {
        $match: matchQuery
      },
      {
        $project: {
          location: 1,
          category: 1,
          status: 1,
          priority: 1,
          // Calculate grid cell coordinates
          cell: {
            x: {
              $floor: {
                $divide: [
                  { $arrayElemAt: ["$location.coordinates", 0] }, // longitude
                  gridSize
                ]
              }
            },
            y: {
              $floor: {
                $divide: [
                  { $arrayElemAt: ["$location.coordinates", 1] }, // latitude
                  gridSize
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: { x: "$cell.x", y: "$cell.y" },
          count: { $sum: 1 },
          reportIds: { $push: "$_id" },
          // Calculate centroid of cluster
          avgLon: { $avg: { $arrayElemAt: ["$location.coordinates", 0] } },
          avgLat: { $avg: { $arrayElemAt: ["$location.coordinates", 1] } },
          // Count reports by status
          statusCounts: {
            $push: "$status"
          },
          // Count reports by category
          categoryCounts: {
            $push: "$category"
          }
        }
      },
      {
        $project: {
          _id: 0,
          cellId: { $concat: [{ $toString: "$_id.x" }, "-", { $toString: "$_id.y" }] },
          count: 1,
          reportIds: 1,
          coordinates: [
            "$avgLon",
            "$avgLat"
          ],
          statusCounts: 1,
          categoryCounts: 1
        }
      }
    ]);
    
    // Process the clusters to count status and category occurrences
    const processedClusters = clusters.map(cluster => {
      // Count status occurrences
      const statusCounts = {};
      cluster.statusCounts.forEach(status => {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      // Count category occurrences
      const categoryCounts = {};
      cluster.categoryCounts.forEach(category => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      
      return {
        ...cluster,
        statusCounts,
        categoryCounts,
        // Remove the arrays used for counting
        statusCounts: undefined,
        categoryCounts: undefined
      };
    });
    
    return NextResponse.json({ clusters: processedClusters });
  } catch (error) {
    console.error('Error generating map clusters:', error);
    return NextResponse.json(
      { error: 'Failed to generate map clusters' },
      { status: 500 }
    );
  }
}