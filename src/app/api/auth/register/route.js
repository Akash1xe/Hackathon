import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/model/User';
import { apiError, requestIp } from '@/lib/http';
import { checkRateLimit } from '@/lib/rateLimit';
import { cleanText, isValidEmail, normalizeEmail, validatePassword } from '@/lib/validation';

export async function POST(request) {
  try {
    const rate = await checkRateLimit(`register:${requestIp(request)}`, { limit: 5, windowMs: 15 * 60_000 });
    if (!rate.allowed) return apiError('Too many registration attempts. Please try again later.', 429);
    const body = await request.json();
    const name = cleanText(body.name, 80);
    const email = normalizeEmail(body.email);
    const phone = cleanText(body.phone, 20);
    const passwordError = validatePassword(body.password);

    const errors = {};
    if (name.length < 2) errors.name = 'Enter your full name.';
    if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
    if (passwordError) errors.password = passwordError;
    if (Object.keys(errors).length) return apiError('Please correct the highlighted fields.', 400, errors);

    await dbConnect();
    const existingUser = await User.exists({ email });
    if (existingUser) return apiError('An account with this email already exists.', 409);

    const password = await bcrypt.hash(body.password, 12);
    const user = await User.create({ name, email, phone, password, role: 'citizen' });

    return NextResponse.json({
      message: 'Account created successfully.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) return apiError('An account with this email already exists.', 409);
    console.error('Registration failed:', error);
    return apiError('Unable to create your account right now.', 500);
  }
}
