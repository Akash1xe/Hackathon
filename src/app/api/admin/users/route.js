import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError, parsePagination } from '@/lib/http';
import { cleanText, escapeRegex } from '@/lib/validation';
import User from '@/model/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return apiError('Administrator access required.', 403);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams, { limit: 20, maxLimit: 100 });
    const role = cleanText(searchParams.get('role'), 20);
    const search = cleanText(searchParams.get('search'), 100);
    const query = {};
    if (['citizen', 'admin'].includes(role)) query.role = role;
    if (search) { const safe = escapeRegex(search); query.$or = [{ name: { $regex: safe, $options: 'i' } }, { email: { $regex: safe, $options: 'i' } }]; }
    await dbConnect();
    const [users, total] = await Promise.all([User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(query)]);
    return NextResponse.json({ users, pagination: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    console.error('Unable to load users:', error);
    return apiError('Unable to load users.', 500);
  }
}
