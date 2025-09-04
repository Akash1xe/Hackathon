// File: c:\hackathon\src\app\api\departments\route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Department from '@/model/Department';

// Get all departments
export async function GET(request) {
  try {
    await dbConnect();
    
    const departments = await Department.find({ active: true })
      .select('name description categories contactEmail');
    
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// Create a new department (admin only)
export async function POST(request) {
  try {
    await dbConnect();
    
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You must be an admin to create departments' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Department name is required' },
        { status: 400 }
      );
    }
    
    // Check if department already exists
    const existingDepartment = await Department.findOne({ name: data.name });
    if (existingDepartment) {
      return NextResponse.json(
        { error: 'A department with this name already exists' },
        { status: 409 }
      );
    }
    
    // Create new department
    const department = new Department(data);
    await department.save();
    
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
}