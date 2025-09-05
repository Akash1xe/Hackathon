// File: c:\hackathon\src\app\api\notifications\route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/model/Notification';

// Get notifications for the authenticated user
export async function GET(request) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to view notifications' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { recipient: session.user.id };
    if (unreadOnly) query.read = false;
    
    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedReport', 'title')
      .populate('relatedDepartment', 'name');
    
    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({ 
      recipient: session.user.id,
      read: false
    });
    
    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Create a notification
export async function POST(request) {
  try {
    await dbConnect();
    
    // Only allow admins and system to create notifications
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can create notifications directly' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.recipient || !data.type || !data.title || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields: recipient, type, title, and message are required' },
        { status: 400 }
      );
    }
    
    // Create notification
    const notification = new Notification(data);
    await notification.save();
    
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// Mark all notifications as read
export async function PATCH(request) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update notifications' },
        { status: 401 }
      );
    }
    
    // Update all unread notifications for this user
    const result = await Notification.updateMany(
      { recipient: session.user.id, read: false },
      { read: true, readAt: new Date() }
    );
    
    return NextResponse.json({
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}