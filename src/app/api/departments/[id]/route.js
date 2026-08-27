import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { CATEGORY_VALUES } from '@/lib/constants';
import { cleanText, isValidEmail, isValidObjectId, normalizeEmail } from '@/lib/validation';
import Department from '@/model/Department';

async function resolveId(params) {
  const { id } = await params;
  return id;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

export async function GET(request, { params }) {
  try {
    const id = await resolveId(params);
    if (!isValidObjectId(id)) return apiError('Invalid department ID.', 400);
    await dbConnect();
    const department = await Department.findById(id).select('name description categories contactEmail contactPhone active');
    return department ? NextResponse.json(department) : apiError('Department not found.', 404);
  } catch (error) {
    console.error('Unable to load department:', error);
    return apiError('Unable to load this department.', 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    if (!await requireAdmin()) return apiError('Administrator access required.', 403);
    const id = await resolveId(params);
    if (!isValidObjectId(id)) return apiError('Invalid department ID.', 400);
    const body = await request.json();
    await dbConnect();
    const department = await Department.findById(id);
    if (!department) return apiError('Department not found.', 404);

    if (body.name !== undefined) {
      const name = cleanText(body.name, 100);
      if (name.length < 2) return apiError('Department name is required.', 400);
      department.name = name;
    }
    if (body.description !== undefined) department.description = cleanText(body.description, 600);
    if (body.contactEmail !== undefined) {
      const email = normalizeEmail(body.contactEmail);
      if (email && !isValidEmail(email)) return apiError('Enter a valid contact email.', 400);
      department.contactEmail = email;
    }
    if (body.contactPhone !== undefined) department.contactPhone = cleanText(body.contactPhone, 30);
    if (Array.isArray(body.categories)) department.categories = [...new Set(body.categories.filter((item) => CATEGORY_VALUES.includes(item)))];
    if (typeof body.active === 'boolean') department.active = body.active;
    await department.save();
    return NextResponse.json(department);
  } catch (error) {
    if (error?.code === 11000) return apiError('A department with this name already exists.', 409);
    console.error('Unable to update department:', error);
    return apiError('Unable to update this department.', 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!await requireAdmin()) return apiError('Administrator access required.', 403);
    const id = await resolveId(params);
    if (!isValidObjectId(id)) return apiError('Invalid department ID.', 400);
    await dbConnect();
    const department = await Department.findById(id);
    if (!department) return apiError('Department not found.', 404);
    department.active = false;
    await department.save();
    return NextResponse.json({ message: 'Department archived.' });
  } catch (error) {
    console.error('Unable to archive department:', error);
    return apiError('Unable to archive this department.', 500);
  }
}
