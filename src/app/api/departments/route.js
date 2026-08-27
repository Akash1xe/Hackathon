import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { CATEGORY_VALUES } from '@/lib/constants';
import { cleanText, isValidEmail, normalizeEmail } from '@/lib/validation';
import Department from '@/model/Department';

export async function GET() {
  try {
    await dbConnect();
    const departments = await Department.find({ active: true }).select('name description categories contactEmail contactPhone').sort({ name: 1 });
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Unable to load departments:', error);
    return apiError('Unable to load departments.', 500);
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return apiError('Administrator access required.', 403);
    const body = await request.json();
    const name = cleanText(body.name, 100);
    const contactEmail = normalizeEmail(body.contactEmail);
    if (name.length < 2) return apiError('Department name is required.', 400);
    if (contactEmail && !isValidEmail(contactEmail)) return apiError('Enter a valid contact email.', 400);
    await dbConnect();
    const department = await Department.create({
      name,
      description: cleanText(body.description, 600),
      categories: Array.isArray(body.categories) ? body.categories.filter((item) => CATEGORY_VALUES.includes(item)) : [],
      contactEmail,
      contactPhone: cleanText(body.contactPhone, 30),
      active: true
    });
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) return apiError('A department with this name already exists.', 409);
    console.error('Unable to create department:', error);
    return apiError('Unable to create this department.', 500);
  }
}
