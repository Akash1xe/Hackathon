// File: c:\hackathon\src\app\api\admin\batch-update\route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Report from '@/model/Report';
import mongoose from 'mongoose';

export async function POST(request) {
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
    
    const data = await request.json();
    const { 
      reportIds, 
      polygon, 
      filterStatus, 
      filterCategory, 
      updateData,
      comment 
    } = data;
    
    // Ensure either reportIds or polygon is provided
    if (!reportIds && !polygon) {
      return NextResponse.json(
        { error: 'Either reportIds or polygon must be provided' },
        { status: 400 }
      );
    }
    
    // Ensure updateData is provided
    if (!updateData || (Object.keys(updateData).length === 0)) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }
    
    // Build query
    let query = {};
    
    if (reportIds && Array.isArray(reportIds) && reportIds.length > 0) {
      // Convert string IDs to ObjectIds
      const objectIds = reportIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      
      query._id = { $in: objectIds };
    } else if (polygon && Array.isArray(polygon) && polygon.length >= 3) {
      // Ensure polygon is closed
      const closedPolygon = [...polygon];
      if (JSON.stringify(closedPolygon[0]) !== JSON.stringify(closedPolygon[closedPolygon.length - 1])) {
        closedPolygon.push(closedPolygon[0]);
      }
      
      query['location.coordinates'] = {
        $geoWithin: {
          $geometry: {
            type: 'Polygon',
            coordinates: [closedPolygon]
          }
        }
      };
    }
    
    // Add filters if provided
    if (filterStatus) query.status = filterStatus;
    if (filterCategory) query.category = filterCategory;
    
    // Prepare update data
    const updateObj = { ...updateData };
    
    // Add timestamp
    updateObj.updatedAt = new Date();
    
    // Add status history entry if status is changing
    if (updateObj.status) {
      const statusUpdate = {
        $push: {
          statusHistory: {
            status: updateObj.status,
            timestamp: new Date(),
            comment: comment || `Batch updated by admin ${session.user.name}`
          }
        }
      };
      
      // Find reports to update
      const reportsToUpdate = await Report.find(query);
      
      // Update each report individually to properly handle status history
      const updatePromises = reportsToUpdate.map(async (report) => {
        // Add status history entry
        await Report.updateOne(
          { _id: report._id },
          statusUpdate
        );
        
        // Update other fields
        return Report.updateOne(
          { _id: report._id },
          { $set: updateObj }
        );
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      // Get count of updated reports
      const updatedCount = reportsToUpdate.length;
      
      return NextResponse.json({
        success: true,
        message: `Successfully updated ${updatedCount} reports`,
        count: updatedCount
      });
    } else {
      // If not updating status, we can use updateMany
      const result = await Report.updateMany(
        query,
        { $set: updateObj }
      );
      
      return NextResponse.json({
        success: true,
        message: `Successfully updated ${result.modifiedCount} reports`,
        count: result.modifiedCount
      });
    }
  } catch (error) {
    console.error('Error performing batch update:', error);
    return NextResponse.json(
      { error: 'Failed to perform batch update' },
      { status: 500 }
    );
  }
}