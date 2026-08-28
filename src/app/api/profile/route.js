import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import User from '@/model/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError('Please sign in to view your civic profile.', 401);
    await dbConnect();
    const user = await User.findById(session.user.id).select('name avatar reputation createdAt').lean();
    if (!user) return apiError('Profile not found.', 404);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Unable to load civic profile:', error);
    return apiError('Unable to load your civic profile.', 500);
  }
}
