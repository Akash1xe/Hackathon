import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { isValidObjectId } from '@/lib/validation';
import Notification from '@/model/Notification';

async function ownedNotification(params, userId) {
  const { id } = await params;
  if (!isValidObjectId(id)) return { error: apiError('Invalid notification ID.', 400) };
  await dbConnect();
  const notification = await Notification.findOne({ _id: id, recipient: userId });
  return notification ? { notification } : { error: apiError('Notification not found.', 404) };
}

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiError('Please sign in to view notifications.', 401);
  const result = await ownedNotification(params, session.user.id);
  if (result.error) return result.error;
  await result.notification.populate('relatedReport', 'title referenceId status');
  return NextResponse.json(result.notification);
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiError('Please sign in to update notifications.', 401);
  const result = await ownedNotification(params, session.user.id);
  if (result.error) return result.error;
  const body = await request.json().catch(() => ({}));
  result.notification.read = body.read !== false;
  result.notification.readAt = result.notification.read ? (result.notification.readAt || new Date()) : undefined;
  await result.notification.save();
  return NextResponse.json(result.notification);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiError('Please sign in to delete notifications.', 401);
  const result = await ownedNotification(params, session.user.id);
  if (result.error) return result.error;
  await result.notification.deleteOne();
  return NextResponse.json({ message: 'Notification deleted.' });
}
