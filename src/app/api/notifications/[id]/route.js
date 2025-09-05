// File: c:\hackathon\src\app\api\notifications\[id]\route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/model/Notification';
import mongoose from 'mongoose';

// Helper to check if ID is valid
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Get a single notification
export async function GET(request, { params }) {
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
    
    const id = params.id;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID format' },
        { status: 400 }
      );
    }
    
    // Find notification
    const notification = await Notification.findById(id)
      .populate('relatedReport', 'title status category')
      .populate('relatedDepartment', 'name');
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Check if notification belongs to user
    if (notification.recipient.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to view this notification' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

// Mark notification as read
export async function PATCH(request, { params }) {
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
    
    const id = params.id;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      );
    }
    
    // Find notification
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Check if notification belongs to user
    if (notification.recipient.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only update your own notifications' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Update read status
    notification.read = data.read !== undefined ? data.read : true;
    
    // Set readAt timestamp if marking as read
    if (notification.read && !notification.readAt) {
      notification.readAt = new Date();
    }
    
    await notification.save();
    
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// Delete notification
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete notifications' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      );
    }
    
    // Find notification
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Check if notification belongs to user
    if (notification.recipient.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only delete your own notifications' },
        { status: 403 }
      );
    }
    
    await notification.deleteOne();
    
    return NextResponse.json(
      { message: 'Notification deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}