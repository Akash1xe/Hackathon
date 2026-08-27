import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError, parsePagination } from '@/lib/http';
import Notification from '@/model/Notification';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError('Please sign in to view notifications.', 401);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams, { limit: 12, maxLimit: 50 });
    const query = { recipient: session.user.id };
    if (searchParams.get('unread') === 'true') query.read = false;
    await dbConnect();
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('relatedReport', 'title referenceId status').populate('relatedDepartment', 'name'),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: session.user.id, read: false })
    ]);
    return NextResponse.json({ notifications, unreadCount, pagination: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    console.error('Unable to load notifications:', error);
    return apiError('Unable to load notifications.', 500);
  }
}

export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError('Please sign in to update notifications.', 401);
    await dbConnect();
    const result = await Notification.updateMany({ recipient: session.user.id, read: false }, { $set: { read: true, readAt: new Date() } });
    return NextResponse.json({ message: 'Notifications marked as read.', modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Unable to mark notifications as read:', error);
    return apiError('Unable to update notifications.', 500);
  }
}
