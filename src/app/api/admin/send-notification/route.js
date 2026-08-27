import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { cleanText, isValidObjectId, normalizeEmail } from '@/lib/validation';
import User from '@/model/User';
import Notification from '@/model/Notification';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return apiError('Administrator access required.', 403);
    const body = await request.json();
    const title = cleanText(body.title, 120);
    const message = cleanText(body.message, 1200);
    if (!title || !message) return apiError('Title and message are required.', 400);
    if (!['user', 'role', 'all'].includes(body.recipientType)) return apiError('Choose a valid recipient group.', 400);
    await dbConnect();

    let query = { active: { $ne: false } };
    if (body.recipientType === 'role') query.role = body.role === 'admin' ? 'admin' : 'citizen';
    if (body.recipientType === 'user') {
      if (isValidObjectId(body.recipientId)) query._id = body.recipientId;
      else if (body.recipientEmail) query.email = normalizeEmail(body.recipientEmail);
      else return apiError('Choose a recipient.', 400);
    }
    const recipients = await User.find(query).select('_id').limit(5000);
    if (!recipients.length) return apiError('No matching recipients were found.', 404);
    const relatedReport = isValidObjectId(body.relatedReportId) ? body.relatedReportId : undefined;
    await Notification.insertMany(recipients.map((recipient) => ({ recipient: recipient._id, type: 'admin_alert', title, message, relatedReport, read: false })));
    return NextResponse.json({ message: `Notification sent to ${recipients.length} people.`, count: recipients.length }, { status: 201 });
  } catch (error) {
    console.error('Unable to send notifications:', error);
    return apiError('Unable to send this notification.', 500);
  }
}
