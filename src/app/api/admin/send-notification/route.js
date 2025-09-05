// File: c:\hackathon\src\app\api\admin\send-notification\route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import User from '@/model/User';
import Notification from '@/model/Notification';
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
      recipientType, 
      recipientId, 
      recipientEmail,
      title, 
      message, 
      type = 'admin_alert',
      relatedReportId
    } = data;
    
    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }
    
    // Validate recipient info
    if (!recipientType) {
      return NextResponse.json(
        { error: 'Recipient type is required' },
        { status: 400 }
      );
    }
    
    // Find recipients based on type
    let recipients = [];
    
    if (recipientType === 'user') {
      // Single user recipient
      if (!recipientId && !recipientEmail) {
        return NextResponse.json(
          { error: 'Either recipient ID or email is required for user notifications' },
          { status: 400 }
        );
      }
      
      let user;
      if (recipientId && mongoose.Types.ObjectId.isValid(recipientId)) {
        user = await User.findById(recipientId);
      } else if (recipientEmail) {
        user = await User.findOne({ email: recipientEmail });
      }
      
      if (!user) {
        return NextResponse.json(
          { error: 'Recipient user not found' },
          { status: 404 }
        );
      }
      
      recipients.push(user);
    } 
    else if (recipientType === 'role') {
      // All users with a specific role (citizen or admin)
      const role = data.role || 'citizen';
      recipients = await User.find({ role });
      
      if (recipients.length === 0) {
        return NextResponse.json(
          { error: `No users found with role: ${role}` },
          { status: 404 }
        );
      }
    }
    else if (recipientType === 'all') {
      // All users
      recipients = await User.find({});
      
      if (recipients.length === 0) {
        return NextResponse.json(
          { error: 'No users found in the system' },
          { status: 404 }
        );
      }
    }
    else {
      return NextResponse.json(
        { error: 'Invalid recipient type' },
        { status: 400 }
      );
    }
    
    // Create notifications for each recipient
    const notifications = [];
    
    for (const recipient of recipients) {
      const notification = new Notification({
        recipient: recipient._id,
        type,
        title,
        message,
        relatedReport: relatedReportId && mongoose.Types.ObjectId.isValid(relatedReportId) 
          ? relatedReportId 
          : undefined,
        read: false
      });
      
      await notification.save();
      
      // Add notification to user's notifications array
      await User.findByIdAndUpdate(
        recipient._id,
        { $push: { notifications: notification._id } }
      );
      
      notifications.push(notification);
    }
    
    return NextResponse.json({
      message: `Sent ${notifications.length} notifications successfully`,
      count: notifications.length
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}